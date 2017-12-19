module.exports = function(listeners) {
  const state = {};
  const outs = {};

  listeners = Object.assign({}, {
    raised: async (_key, _prev, _next, _out) => undefined,
    changed: async (_key, _prev, _next, _out) => undefined,
    dropped: async (_key, _prev, _next, _out) => undefined
  }, listeners);

  return async function update(input) {
    const ins = await input;
    const join = [];

    // handle new and existing inputs
    for( const k in ins ) {
      start(join, async () => {
        if( !(k in state) )
          outs[k] = await listeners.raised(k, undefined, ins[k], undefined);

        if( !Object.is(state[k], ins[k]) )
          outs[k] = await listeners.changed(k, ins[k], state[k], outs[k]);

        state[k] = ins[k];
      });
    }

    // handle dropped inputs
    for( const k in state ) {
      if( !(k in ins) ) {
        start(join, async () => {
          await listeners.dropped(k, state[k], undefined, outs[k]);
          delete state[k];
          delete outs[k];
        });
      }
    }

    await Promise.all(join);

    return outs;
  };
};

function start(list, fn) {
  list.push(Promise.resolve(fn()));
}

