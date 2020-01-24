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

    get(keys: K): V | undefined;
    get(keys: K, defaultValue: V): V;
    get(keys: K, ...args: [] | [V]): V | undefined {
        const store = this.__getStore(keys);
        if (!hasProperty(store, 'value') && args.length !== 0) {
            store.value = args[0];
        }
        return store.value;
    }

    getWithDefaultCallback(keys: K, defaultCallback: () => V): V {
        const store = this.__getStore(keys);
        if (hasProperty(store, 'value')) {
            return store.value;
        }
        return (store.value = defaultCallback());
    }

    getWithTypeGuard<U extends V>(
        keys: K,
        typeGuard: (value: V | undefined) => value is U,
    ): U | undefined;

    getWithTypeGuard<U extends V>(
        keys: K,
        typeGuard: (value: V | undefined) => value is U,
        defaultValue: V,
    ): U;

    getWithTypeGuard<U extends V>(
        keys: K,
        typeGuard: (value: V | undefined) => value is U,
        ...args: [] | [V]
    ): U | undefined {
        const value =
            args.length !== 0 ? this.get(keys, args[0]) : this.get(keys);
        return typeGuard(value) ? value : undefined;
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
