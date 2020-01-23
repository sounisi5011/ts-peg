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

    get(keys: K, defaultValue?: V): V | undefined {
        const store = this.__getStore(keys);
        if (
            !Object.prototype.hasOwnProperty.call(store, 'value') &&
            arguments.length >= 2
        ) {
            store.value = defaultValue;
        }
        return store.value;
    }

    getWithTypeGuard<U extends V>(
        keys: K,
        typeGuard: (value: V | undefined) => value is U,
        defaultValue?: V,
    ): U | undefined {
        const value =
            arguments.length >= 3
                ? this.get(keys, defaultValue)
                : this.get(keys);
        return typeGuard(value) ? value : undefined;
    }

    set(keys: K, value: V): this {
        const store = this.__getStore(keys);
        store.value = value;
        return this;
    }

    has(keys: K): boolean {
        const store = this.__getStore(keys);
        return Object.prototype.hasOwnProperty.call(store, 'value');
    }

    delete(keys: K): boolean {
        const store = this.__getStore(keys);
        if (Object.prototype.hasOwnProperty.call(store, 'value')) {
            return delete store.value;
        }
        return false;
    }

    private __getStore(keys: K): StoreItem<V> {
        let targetStore = this.__store;
        for (const key of keys) {
            let store = this.__isObject(key)
                ? targetStore.childrenObjectMap.get(key)
                : targetStore.childrenPrimitiveMap.get(key);
            if (!store) {
                store = {
                    childrenPrimitiveMap: new Map(),
                    childrenObjectMap: new WeakMap(),
                };
                if (this.__isObject(key)) {
                    targetStore.childrenObjectMap.set(key, store);
                } else {
                    targetStore.childrenPrimitiveMap.set(key, store);
                }
            }
            targetStore = store;
        }
        return targetStore;
    }

    private __isObject(value: unknown): value is object {
        return (
            (typeof value === 'object' && value !== null) ||
            typeof value === 'function'
        );
    }
}
