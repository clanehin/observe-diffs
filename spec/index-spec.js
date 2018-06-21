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
    expect(count).toBe(0);
    await f({ foo: 'baz' });
    expect(count).toBe(1);
    await f({});
    expect(count).toBe(1);
    done();
  });

  it('listeners.changed() provides the key, before, after, and previous out values', async function(done) {
    let count = 0;

    const f = observeDiffs({
      raised: (key, prev, next, out) => {
        expect(key).toBe('foo');
        expect(prev).not.toBeDefined();
        expect(next).toBe(0);
        expect(out).not.toBeDefined();
        return 0;
      },
      changed: (key, prev, next, out) => {
        expect(key).toBe('foo');
        expect(prev).toBe(next - 1);
        expect(next).toBe(prev + 1);
        expect(out).toBe(prev * 42);
        count++;
        return next*42;
      },
      dropped: (key,prev,next,out) => {
        expect(key).toBe('foo');
        expect(prev).toBe(2);
        expect(next).not.toBeDefined();
        expect(out).toBe(48);
      }
    });

    expect(count).toBe(0);
    await f({ foo: 0 });
    expect(count).toBe(0);
    await f({ foo: 1 });
    expect(count).toBe(1);
    await f({ foo: 2 });
    expect(count).toBe(2);
    done();
  });

  it('listeners fields are available to listeners', async function(done) {
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
    expect(count).toBe(1);
    await f({ foo: 'baz' });
    expect(count).toBe(2);
    await f({ quuz: 17 });
    expect(count).toBe(4);
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
        expect(o).toBe(12);
        drops++;
      }
    });

    expect(await f({ foo: 'bar' })).toEqual({ foo: 10 });
    expect(await f({ foo: 'baz' })).toEqual({ foo: 11 });
    expect(await f({ foo: 'baz', quux: 17 })).toEqual({ foo: 11, quux: 10 });
    expect(await f({ foo: 'bar', quux: 19 })).toEqual({ foo: 12, quux: 11 });
    expect(await f({ quux: 21 })).toEqual({ quux: 12 });
    expect(await f({})).toEqual({});
    expect(drops).toBe(2);
    done();
  });

  it('runs in predictable order', async function(done) {
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
      'raised foo',
      'raised bar',
      'dropped foo',
      'changed bar',
      'raised quux',]);
    done();
  });

  it('runs in predictable order with key sort and disabled concurrency', async function(done) {
    const events = [];

    const f = observeDiffs({
      raised: async (k) => events.push('raised ' + k),
      changed: async (k) => events.push('changed ' + k),
      dropped: async (k) => events.push('dropped ' + k),
      keys: o => {
        const result = Object.keys(o);
        result.sort();
        return result;
      },
      concurrency: 1
    });

    //note: this works because we've forced the program to run in
    // single-concurrency mode and sorted the keys
    await Promise.all([
      f({ foo: 0 }),
      f({ foo: 1, bar: 1, quux: 10 }),
      f({ foo: 2, bar: 2, quux: 9 })]);

    expect(events).toEqual([
      'raised foo',
      'raised bar',
      'changed foo',
      'raised quux',
      'changed bar',
      'changed foo',
      'changed quux']);
    done();
  });

  it('correctly executes the README example', async function(done) {
    const f = observeDiffs({ changed: (_key,prev,next) => {
      return next - prev;
    }});

    expect(await f({ foo: 0 })).toEqual({});
    expect(await f({ foo: 1,  bar: 10 })).toEqual({ foo: 1 });
    expect(await f({ foo: -1, bar: 20 })).toEqual({ foo: -2, bar: 10 });
    expect(await f({ foo: 0,  bar: 10 })).toEqual({ foo: 1, bar: -10 });
    expect(await f({ foo: 0 })).toEqual({ foo: 1 });
    done();
  });
});
