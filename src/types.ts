/*
 * Modify the Array.isArray function so that it can correctly Type Guard the ReadonlyArray type.
 * @example
 *   (Array.isArray as isReadonlyOrWritableArray)(value)
 *   (<isReadonlyOrWritableArray>Array.isArray)(value)
 */
export type isReadonlyOrWritableArray = (
    value: unknown,
) => value is readonly unknown[];

export type OneOrMoreTuple<T> = [T, ...T[]];
export type OneOrMoreReadonlyTuple<T> = readonly [T, ...T[]];

export function isOneOrMoreTuple<T>(value: T[]): value is OneOrMoreTuple<T>;
export function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T>;
export function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T> {
    return value.length >= 1;
}
