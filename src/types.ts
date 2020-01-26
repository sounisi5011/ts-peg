import * as typepark from 'typepark';

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

/**
 * A tuple type in which TValue is repeated TCount times.
 * This generic type has the following fixes to the Repeat type in the typepark package:
 * + Supports non-literal numeric type. If a non-literal numeric type is specified in TCount, returns an array of TValue.
 * + Supports union numeric type. If the union type is specified in TCount, returns the union type of the tuple.
 *
 * @example
 * RepeatTuple<ValueType, 0>      // returns: []
 * @example
 * RepeatTuple<ValueType, 1>      // returns: [ValueType]
 * @example
 * RepeatTuple<ValueType, 2>      // returns: [ValueType, ValueType]
 * @example
 * RepeatTuple<ValueType, number> // returns: ValueType[]
 * @example
 * RepeatTuple<ValueType, 1 | 2>  // returns: [ValueType] | [ValueType, ValueType]
 */
export type RepeatTuple<TValue, TCount extends number> = TCount extends unknown
    ? number extends TCount
        ? TValue[]
        : typepark.Repeat<TValue, TCount>
    : never;

export function isOneOrMoreTuple<T>(value: T[]): value is OneOrMoreTuple<T>;
export function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T>;
export function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T> {
    return value.length >= 1;
}
