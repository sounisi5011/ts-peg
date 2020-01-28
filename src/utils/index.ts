export function hasProperty<TObj, TProp extends PropertyKey>(
    object: TObj,
    property: TProp,
): object is TObj &
    (TProp extends keyof TObj
        ? Required<Pick<TObj, TProp>>
        : { [P in TProp]: unknown }) {
    return Object.prototype.hasOwnProperty.call(object, property);
}

export function filterList<T, S extends T>(
    list: readonly T[],
    callbackfn: (value: T, index: number, array: readonly T[]) => value is S,
): { filtered: S[]; excludeFiltered: Exclude<T, S>[] };
export function filterList<T>(
    list: readonly T[],
    callbackfn: (value: T, index: number, array: readonly T[]) => boolean,
): { filtered: T[]; excludeFiltered: T[] };
export function filterList<T>(
    list: readonly T[],
    callbackfn: (value: T, index: number, array: readonly T[]) => boolean,
): { filtered: T[]; excludeFiltered: T[] } {
    return list.reduce<{ filtered: T[]; excludeFiltered: T[] }>(
        ({ filtered, excludeFiltered }, value, index, array) => {
            if (callbackfn(value, index, array)) {
                filtered.push(value);
            } else {
                excludeFiltered.push(value);
            }
            return { filtered, excludeFiltered };
        },
        { filtered: [], excludeFiltered: [] },
    );
}

export function* matchAll(
    str: string,
    regexp: RegExp,
): Generator<RegExpExecArray, void> {
    let match;
    while ((match = regexp.exec(str))) {
        yield match;
    }
}

/**
 * @see https://github.com/benjamingr/RegExp.escape
 */
export function escapeRegExp(str: string): string {
    return str.replace(/[$^\\.*+?()[\]{}|]/g, '\\$&');
}
