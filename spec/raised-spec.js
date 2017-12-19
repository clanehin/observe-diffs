const observeChanges = require('../src/index');

describe('observeChanges', function() {
  it('listeners.raise() is called when a key appears', async function(done) {
    let count = 0;

    const f = observeChanges({ raised: (key, prev, next, out) => {
      expect(key).toBe('foo');
      expect(prev).not.toBeDefined();
      expect(next).toBe('bar');
      expect(out).not.toBeDefined();
      count++;
    }});

    expect(count).toBe(0);
    await f({ foo: 'bar' });
    expect(count).toBe(1);
    done();
  });

  it('listeners.dropped() is called when a key disappears', async function(done) {
    let count = 0;

    const f = observeChanges({ dropped: (key, prev, next, out) => {
      expect(key).toBe('foo');
      expect(prev).toBe('bar');
      expect(next).not.toBeDefined();
      expect(out).not.toBeDefined();
      count++;
    }});

    expect(count).toBe(0);
    await f({ foo: 'bar' });
    expect(count).toBe(0);
    await f({ bar: 'baz' });
    expect(count).toBe(1);
    done();
  });

  it('listeners.changed() is called every time a key changes', async function(done) {
    let count = 0;

    const f = observeChanges({ changed: (key, prev, next, out) => {
      expect(key).toBe('foo');
      expect(prev !== next).toBe(true);
      expect(out).not.toBeDefined();
      count++;
    }});

    expect(count).toBe(0);
    await f({ foo: 'bar' });
    expect(count).toBe(1);
    await f({ foo: 'baz' });
    expect(count).toBe(2);
    await f({});
    expect(count).toBe(2);
    done();
  });

  it('listeners object is available to listeners', async function(done) {
    let count = 0;

    const listeners = {
      unit_test_kitten: 99
    };

    const listen = function(_k,_p,_n,_o) {
      expect(this).not.toBe(listeners);
      expect(this.raised).toBe(listen);
      expect(this.changed).toBe(listen);
      expect(this.dropped).toBe(listen);
      expect(this.unit_test_kitten).toBe(99);
      count++;
    };

    listeners.raised = listen;
    listeners.changed = listen;
    listeners.dropped = listen;

    const f = observeChanges(listeners);

    expect(count).toBe(0);
    await f({ foo: 'bar' });
    expect(count).toBe(2);
    await f({ foo: 'baz' });
    expect(count).toBe(3);
    await f({ quuz: 17 });
    expect(count).toBe(6);
    done();
  });

  it('listeners can return an output value', async function(done) {
    let drops = 0;

    const f = observeChanges({
      raised: (_k,_v,_n,o) => {
        expect(o).not.toBeDefined();
        return 10;
      },
      changed: (_k,_v,_n,o) => {
        expect(typeof o).toBe('number');
        return o+1;
      },
      dropped: (_k,_v,_n,o) => {
        expect(o).toBe(13);
        drops++;
      }
    });

    expect(await f({ foo: 'bar' })).toEqual({ foo: 11 });
    expect(await f({ foo: 'baz' })).toEqual({ foo: 12 });
    expect(await f({ foo: 'baz', quux: 17 })).toEqual({ foo: 12, quux: 11 });
    expect(await f({ foo: 'bar', quux: 19 })).toEqual({ foo: 13, quux: 12 });
    expect(await f({ quux: 21 })).toEqual({ quux: 13 });
    expect(await f({})).toEqual({});
    expect(drops).toBe(2);
    done();
  });
});
