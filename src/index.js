module.exports = function(params) {
  let serial = Promise.resolve();
  const state = {};
  const outs = {};

  params = Object.assign({}, {
    raised: async (_key, _prev, _next, _out) => undefined,
    changed: async (_key, _prev, _next, _out) => undefined,
    dropped: async (_key, _prev, _next, _out) => undefined,
    edge: async (a, b) => !Object.is(a,b),
    keys: async (o) => Object.keys(o),
    concurrency: Infinity,
  }, params);

  const update = async function(input) {
    const ins = await input;
    const visible_keys = {};
    const join = [];

    // handle new and existing inputs
    for( const k of await params.keys(ins) ) {
      visible_keys[k] = true;
      await start(params.concurrency, join, async () => {
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
      if( !(k in visible_keys) ) {
        await start(params.concurrency, join, async () => {
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

async function start(concurrency, list, fn) {
  list.push(Promise.resolve(fn()));

  if( list.length > concurrency ) {
    await Promise.all(list);
    list.length = 0;
  }
}

