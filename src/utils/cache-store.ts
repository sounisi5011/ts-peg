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
