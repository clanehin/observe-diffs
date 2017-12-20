const observeDiffs = require('../src/index');

describe('observeDiffs', function() {
  it('listeners.raise() is called when a key appears', async function(done) {
    let count = 0;

    const f = observeDiffs({ raised: (key, prev, next, out) => {
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

    const f = observeDiffs({ dropped: (key, prev, next, out) => {
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

    const f = observeDiffs({ changed: (key, prev, next, out) => {
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

    const f = observeDiffs(listeners);

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

    const f = observeDiffs({
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

  it('can runs in predictable order', async function(done) {
    const events = [];

    const f = observeDiffs({
      raised: async (k) => events.push('raised ' + k),
      changed: async (k) => events.push('changed ' + k),
      dropped: async (k) => events.push('dropped ' + k)
    });

    //note: this works because there's at most one change per call
    //note: multiple changes might be reported in any order
    await Promise.all([
      f({ foo: 0 }),
      f({ foo: 0, bar: 1 }),
      f({ bar: 1 }),
      f({ bar: 2 }),
      f({ bar: 2, quux: 9 })]);

    expect(events).toEqual([
      'raised foo', 'changed foo',
      'raised bar', 'changed bar',
      'dropped foo',
      'changed bar',
      'raised quux', 'changed quux']);
    done();
  });
});
