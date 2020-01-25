import { hasProperty } from '../utils';

interface StoreItem<T> {
    value?: T;
    childrenPrimitiveMap: Map<unknown, StoreItem<T>>;
    childrenObjectMap: WeakMap<object, StoreItem<T>>;
}

export class CacheStore<K extends [unknown, ...unknown[]], V> {
    private readonly __store: StoreItem<V> = {
        childrenPrimitiveMap: new Map(),
        childrenObjectMap: new WeakMap(),
    };

    get(keys: K): V | undefined {
        const store = this.__getStore(keys);
        return store.value;
    }

    getWithTypeGuard<GV extends V>(
        keys: K,
        typeGuard: (value: V) => value is GV,
    ): GV | undefined {
        const store = this.__getStore(keys);
        return hasProperty(store, 'value') && typeGuard(store.value)
            ? store.value
            : undefined;
    }

    set(keys: K, value: V): this {
        const store = this.__getStore(keys);
        store.value = value;
        return this;
    }

    has(keys: K): boolean {
        const store = this.__getStore(keys);
        return hasProperty(store, 'value');
    }

    delete(keys: K): boolean {
        const store = this.__getStore(keys);
        if (hasProperty(store, 'value')) {
            return delete store.value;
        }
        return false;
    }

    /**
     * @see https://tc39.es/proposal-upsert/
     */
    upsert<UV extends V>(
        keys: K,
        updateFn: (old: V, keys: K, store: this) => UV,
        insertFn?: undefined,
    ): UV | undefined;

    upsert<IV extends V>(
        keys: K,
        updateFn: undefined,
        insertFn: (keys: K, store: this) => IV,
    ): V | IV;

    upsert<UV extends V, IV extends V>(
        keys: K,
        updateFn: (old: V, keys: K, store: this) => UV,
        insertFn: (keys: K, store: this) => IV,
    ): UV | IV;

    upsert(
        keys: K,
        updateFn: ((old: V, keys: K, store: this) => V) | undefined,
        insertFn?: (keys: K, store: this) => V,
    ): V | undefined {
        const store = this.__upsert(keys, updateFn, insertFn);
        return store.value;
    }

    upsertWithTypeGuard<UV extends V, GV extends UV>(
        keys: K,
        updateFn: (old: V, keys: K, store: this) => UV,
        insertFn: undefined,
        typeGuard: (value: UV) => value is GV,
    ): GV | undefined;

    upsertWithTypeGuard<IV extends V, GV extends V>(
        keys: K,
        updateFn: undefined,
        insertFn: (keys: K, store: this) => IV,
        typeGuard: (value: V | IV) => value is GV,
    ): GV;

    upsertWithTypeGuard<UV extends V, IV extends V, GV extends UV | IV>(
        keys: K,
        updateFn: (old: V, keys: K, store: this) => UV,
        insertFn: (keys: K, store: this) => IV,
        typeGuard: (value: UV | IV) => value is GV,
    ): GV;

    upsertWithTypeGuard<GV extends V>(
        keys: K,
        updateFn: ((old: V, keys: K, store: this) => V) | undefined,
        insertFn: ((keys: K, store: this) => V) | undefined,
        typeGuard: (value: V) => value is GV,
    ): GV | undefined {
        const store = this.__upsert(keys, updateFn, insertFn);
        return hasProperty(store, 'value') && typeGuard(store.value)
            ? store.value
            : undefined;
    }

    private __upsert(
        keys: K,
        updateFn: ((old: V, keys: K, store: this) => V) | undefined,
        insertFn: ((keys: K, store: this) => V) | undefined,
    ): StoreItem<V> {
        const store = this.__getStore(keys);
        if (hasProperty(store, 'value')) {
            if (updateFn) {
                store.value = updateFn(store.value, keys, this);
            }
        } else if (insertFn) {
            store.value = insertFn(keys, this);
        }
        return store;
    }

    private __getStore(keys: K): StoreItem<V> {
        return keys.reduce<StoreItem<V>>((parentStore, key) => {
            const childStore = this.__isObject(key)
                ? parentStore.childrenObjectMap.get(key)
                : parentStore.childrenPrimitiveMap.get(key);
            if (childStore) return childStore;

            const newChildStore = {
                childrenPrimitiveMap: new Map(),
                childrenObjectMap: new WeakMap(),
            };
            if (this.__isObject(key)) {
                parentStore.childrenObjectMap.set(key, newChildStore);
            } else {
                parentStore.childrenPrimitiveMap.set(key, newChildStore);
            }
            return newChildStore;
        }, this.__store);
    }

    private __isObject(value: unknown): value is object {
        return (
            (typeof value === 'object' && value !== null) ||
            typeof value === 'function'
        );
    }
}
