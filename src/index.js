module.exports = function(params) {
  let serial = Promise.resolve();
  const state = {};
  const outs = {};

  params = Object.assign({}, {
    raised: async (_key, _prev, _next, _out) => undefined,
    changed: async (_key, _prev, _next, _out) => undefined,
    dropped: async (_key, _prev, _next, _out) => undefined,
    edge: async (a, b) => !Object.is(a,b)
  }, params);

  const update = async function(input) {
    const ins = await input;
    const join = [];

    // handle new and existing inputs
    for( const k of Object.keys(ins) ) {
      start(join, async () => {
        let out = undefined;

        if( !(k in state) )
          out = await params.raised(k, undefined, ins[k], undefined);
        else if( await params.edge(state[k], ins[k]) )
          out = await params.changed(k, state[k], ins[k], outs[k]);
        else
          out = outs[k];

        if( typeof out !== 'undefined' )
          outs[k] = out;

        state[k] = ins[k];
      });
    }

    // handle dropped inputs
    for( const k in state ) {
      if( !(k in ins) ) {
        start(join, async () => {
          await params.dropped(k, state[k], undefined, outs[k]);
          delete state[k];
          delete outs[k];
        });
      }
    }

    await Promise.all(join);

    return outs;
  };

  return function() {
    serial = serial.then(() => update.apply(this,arguments));
    return serial;
  };
};

function start(list, fn) {
  list.push(Promise.resolve(fn()));
}

