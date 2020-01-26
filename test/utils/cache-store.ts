import test from 'ava';

import { CacheStore } from '../../src/utils/cache-store';

test('CacheStore#get() and CacheStore#set()', t => {
    const store = new CacheStore<
        [number, ...number[]],
        string | null | undefined
    >();

    t.is(store.get([1]), undefined);
    t.is(store.set([1], 'foo'), store);
    t.is(store.get([1]), 'foo');
    t.is(store.get([1]), 'foo');
    t.is(store.get([1]), 'foo');

    t.is(store.get([1, 1]), undefined);
    t.is(store.set([1, 1], 'bar'), store);
    t.is(store.get([1, 1]), 'bar');
    t.is(store.get([1, 1]), 'bar');
    t.is(store.get([1, 1]), 'bar');

    t.is(store.get([1, 1, 1]), undefined);
    t.is(store.set([1, 1, 1], 'baz'), store);
    t.is(store.get([1, 1, 1]), 'baz');
    t.is(store.get([1, 1, 1]), 'baz');
    t.is(store.get([1, 1, 1]), 'baz');

    t.is(store.get([1, 2]), undefined);
    t.is(store.set([1, 2], 'qux'), store);
    t.is(store.get([1, 2]), 'qux');
    t.is(store.get([1, 2]), 'qux');
    t.is(store.get([1, 2]), 'qux');

    t.is(store.get([2]), undefined);
    t.is(store.set([2], 'quux'), store);
    t.is(store.get([2]), 'quux');
    t.is(store.get([2]), 'quux');
    t.is(store.get([2]), 'quux');

    t.is(store.get([0, 3]), undefined);
    t.is(store.set([0, 3], null), store);
    t.is(store.get([0, 3]), null);
    t.is(store.get([0, 3]), null);
    t.is(store.get([0, 3]), null);

    t.is(store.get([4]), undefined);
    t.is(store.set([4], undefined), store);
    t.is(store.get([4]), undefined);
    t.is(store.get([4]), undefined);
    t.is(store.get([4]), undefined);

    t.is(store.get([1]), 'foo');
    t.is(store.get([1, 1]), 'bar');
    t.is(store.get([1, 1, 1]), 'baz');
    t.is(store.get([1, 2]), 'qux');
    t.is(store.get([2]), 'quux');
    t.is(store.get([1, 2]), 'qux');
    t.is(store.get([1, 1, 1]), 'baz');
    t.is(store.get([1, 1]), 'bar');
    t.is(store.get([1]), 'foo');
});

test('CacheStore#has()', t => {
    const store = new CacheStore<
        [number, ...number[]],
        string | null | undefined
    >();

    t.false(store.has([1]));
    store.set([1], 'foo');
    t.true(store.has([1]));
    t.true(store.has([1]));
    t.true(store.has([1]));

    t.false(store.has([1, 1]));
    store.set([1, 1], 'bar');
    t.true(store.has([1, 1]));
    t.true(store.has([1, 1]));
    t.true(store.has([1, 1]));

    t.false(store.has([0, 0, 0]));
    store.set([0, 0, 0], 'baz');
    t.true(store.has([0, 0, 0]));
    t.true(store.has([0, 0, 0]));
    t.true(store.has([0, 0, 0]));

    t.false(store.has([2]));
    store.set([2], null);
    t.true(store.has([2]));
    t.true(store.has([2]));
    t.true(store.has([2]));

    t.false(store.has([3]));
    store.set([3], undefined);
    t.true(store.has([3]));
    t.true(store.has([3]));
    t.true(store.has([3]));
});

test('CacheStore#delete()', t => {
    const store = new CacheStore<
        [number, ...number[]],
        string | null | undefined
    >();

    t.false(store.delete([0]));
    t.false(store.delete([0]));
    t.false(store.delete([0]));

    store.set([1], 'foo');
    t.true(store.delete([1]));
    t.false(store.delete([1]));
    t.false(store.delete([1]));
    t.false(store.delete([1]));

    store.set([2], null);
    t.true(store.delete([2]));
    t.false(store.delete([2]));
    t.false(store.delete([2]));
    t.false(store.delete([2]));

    store.set([3], undefined);
    t.true(store.delete([3]));
    t.false(store.delete([3]));
    t.false(store.delete([3]));
    t.false(store.delete([3]));
});

test('CacheStore#upsert()', t => {
    // see https://tc39.es/proposal-upsert/#sec-map.prototype.upsert

    const store = new CacheStore<[number], string>();

    /*
     * Insert
     */
    store.delete([11]);
    t.is(
        store.upsert([11], undefined, () => 'foo'),
        'foo',
    );
    t.is(store.get([11]), 'foo');

    store.set([12], 'bar');
    t.is(
        store.upsert([12], undefined, () => 'foo'),
        'bar',
    );
    t.is(store.get([12]), 'bar');

    store.delete([13]);
    t.is(
        store.upsert(
            [13],
            o => o.toUpperCase(),
            () => 'baz',
        ),
        'baz',
    );
    t.is(store.get([13]), 'baz');

    store.delete([14]);
    t.is(
        store.upsert([14], o => o.toUpperCase()),
        undefined,
    );
    t.false(store.has([14]));

    /*
     * Update
     */
    store.set([21], 'qux');
    t.is(
        store.upsert([21], o => o.toUpperCase()),
        'QUX',
    );
    t.is(store.get([21]), 'QUX');

    store.set([22], 'quux');
    t.is(
        store.upsert([22], o => o.toUpperCase(), undefined),
        'QUUX',
    );
    t.is(store.get([22]), 'QUUX');

    /*
     * Insert or Update
     */
    store.delete([31]);
    t.is(
        store.upsert(
            [31],
            o => o.toUpperCase(),
            () => 'corge',
        ),
        'corge',
    );
    t.is(store.get([31]), 'corge');

    store.set([32], 'grault');
    t.is(
        store.upsert(
            [32],
            o => o.toUpperCase(),
            () => 'corge',
        ),
        'GRAULT',
    );
    t.is(store.get([32]), 'GRAULT');
});
