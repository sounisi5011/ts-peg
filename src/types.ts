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

/**
 * @example
 * MinToMaxTuple<ValueType, 0, 2> // returns: [] | [ValueType] | [ValueType, ValueType]
 * @example
 * MinToMaxTuple<ValueType, 1, 2> // returns: [ValueType] | [ValueType, ValueType]
 * @example
 * MinToMaxTuple<ValueType, 0, 0> // returns: []
 * @example
 * MinToMaxTuple<ValueType, 4, 4> // returns: [ValueType, ValueType, ValueType, ValueType]
 */
export type MinToMaxTuple<
    TResult,
    TMin extends number,
    TMax extends number
> = TMin extends unknown
    ? TMax extends unknown
        ? number extends TMax
            ? OrMoreTuple<TResult, DefaultNumericLiteral<TMin, 0>> //      TMax: number
            : MinToMax_<TResult, DefaultNumericLiteral<TMin, 0>, TMax> // TMax: numeric literal type
        : never
    : never;

typepark.assertType<typepark.TypeEq<MinToMaxTuple<'42', 0, 0>, []>>();
typepark.assertType<typepark.TypeEq<MinToMaxTuple<'42', 0, 1>, [] | ['42']>>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', 0, 2>, [] | ['42'] | ['42', '42']>
>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', 1, 2>, ['42'] | ['42', '42']>
>();
typepark.assertType<
    typepark.TypeEq<
        MinToMaxTuple<'42', 2, 4>,
        ['42', '42'] | ['42', '42', '42'] | ['42', '42', '42', '42']
    >
>();
typepark.assertType<typepark.TypeEq<MinToMaxTuple<'42', number, 0>, []>>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', number, 1>, [] | ['42']>
>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', number, 2>, [] | ['42'] | ['42', '42']>
>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', 0, number>, [...'42'[]]>
>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', 1, number>, ['42', ...'42'[]]>
>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', 2, number>, ['42', '42', ...'42'[]]>
>();
typepark.assertType<
    typepark.TypeEq<MinToMaxTuple<'42', number, number>, [...'42'[]]>
>();

type OrMoreTuple<TResult, TMin extends number> = {
    0: [...TResult[]];
    1: [TResult, ...TResult[]];
    2: [TResult, TResult, ...TResult[]];
    3: [TResult, TResult, TResult, ...TResult[]];
    4: [TResult, TResult, TResult, TResult, ...TResult[]];
    5: [TResult, TResult, TResult, TResult, TResult, ...TResult[]];
    6: [TResult, TResult, TResult, TResult, TResult, TResult, ...TResult[]];
}[TMin extends 0 | 1 | 2 | 3 | 4 | 5 | 6 ? TMin : 0];

type MinToMax_<TResult, TMin extends number, TMax extends number> = RepeatTuple<
    TResult,
    typepark.Range<TMin, TMax>[number]
>;

/**
 * @example
 * DefaultNumericLiteral<1, 0> // returns: 1
 * @example
 * DefaultNumericLiteral<2, 0> // returns: 2
 * @example
 * DefaultNumericLiteral<3, 0> // returns: 3
 * @example
 * DefaultNumericLiteral<number, 0> // returns: 0
 */
type DefaultNumericLiteral<
    T extends number,
    U extends number
> = number extends T ? U : T;

export function isOneOrMoreTuple<T>(value: T[]): value is OneOrMoreTuple<T>;
export function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T>;
export function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T> {
    return value.length >= 1;
}
