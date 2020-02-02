import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../../src';
import { parse } from '../../helpers/parser';

test('should convert result value', t => {
    const num = Math.random();
    const exp1 = p.any.value(42);
    const exp2 = p.any.value('foo').oneOrMore;
    const exp3 = p.any.zeroOrMore.value(num);
    const exp4 = p.any.value(null).oneOrMore;
    const exp5 = p.any.value(undefined).times(2);
    const exp6 = p.any.value(true);
    const exp7 = p.any.value(false);
    const exp8 = p.any.value(1 as 1 | '2' | true);
    const exp9 = p.any.value([false, null, undefined, 42, 'hoge', num]);
    const exp10 = p.any.value([
        false,
        null,
        undefined,
        42,
        'hoge',
        num,
    ] as const);

    t.is(parse(exp1, 'abc')?.data, 42);
    t.deepEqual(parse(exp2, 'abc')?.data, ['foo', 'foo', 'foo']);
    t.is(parse(exp3, '🐉💭😋🏡')?.data, num);
    t.deepEqual(parse(exp4, 'bar')?.data, [null, null, null]);
    t.deepEqual(parse(exp5, 'hoge')?.data, [undefined, undefined]);
    t.is(parse(exp6, 'abc', 1)?.data, true);
    t.is(parse(exp7, 'abc', 2)?.data, false);

    assertType<TypeEq<42, ParserResultDataType<typeof exp1>>>();
    assertType<
        TypeEq<['foo', ...'foo'[]], ParserResultDataType<typeof exp2>>
    >();
    assertType<TypeEq<number, ParserResultDataType<typeof exp3>>>();
    assertType<TypeEq<[null, ...null[]], ParserResultDataType<typeof exp4>>>();
    assertType<
        TypeEq<[undefined, undefined], ParserResultDataType<typeof exp5>>
    >();
    assertType<TypeEq<true, ParserResultDataType<typeof exp6>>>();
    assertType<TypeEq<false, ParserResultDataType<typeof exp7>>>();
    assertType<TypeEq<1 | '2' | true, ParserResultDataType<typeof exp8>>>();
    assertType<
        TypeEq<
            [boolean, null, undefined, number, string, number],
            ParserResultDataType<typeof exp9>
        >
    >();
    assertType<
        TypeEq<
            readonly [false, null, undefined, 42, 'hoge', number],
            ParserResultDataType<typeof exp10>
        >
    >();
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const fn = (): number => 42;
    const obj = {};
    const parser1 = p.any;
    const parser2 = new ParserGenerator().any;
    const parser3 = p.str('foo');
    const action1Num1 = parser1.value(42);
    const action1Num2 = parser1.value(42);
    const action2Num1 = parser2.value(42);
    const action2Num2 = parser2.value(42);
    const action3Num1 = parser3.value(42);
    const action3Num2 = parser3.value(42);
    const action1Undef1 = parser1.value(undefined);
    const action1Undef2 = parser1.value(undefined);
    const action1Fn1 = parser1.value(fn);
    const action1Fn2 = parser1.value(fn);
    const action1Obj1 = parser1.value(obj);
    const action1Obj2 = parser1.value(obj);

    t.is(action1Num1, action1Num2);
    t.is(action2Num1, action2Num2);
    t.is(action3Num1, action3Num2);
    t.is(action1Undef1, action1Undef2);
    t.is(action1Fn1, action1Fn2);
    t.is(action1Obj1, action1Obj2);

    t.not<Parser<unknown>>(action1Num1, action1Undef1);
    t.not(
        action1Num1,
        action2Num1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not(
        action1Num1,
        action3Num1,
        'If the previous Parser instance is different, the Parser object will also be different',
    );
    t.not<Parser<unknown>>(action1Fn1, action2Num1);

    assertType<TypeEq<42, ParserResultDataType<typeof action1Num1>>>();
    assertType<TypeEq<42, ParserResultDataType<typeof action1Num2>>>();
    assertType<TypeEq<42, ParserResultDataType<typeof action2Num1>>>();
    assertType<TypeEq<42, ParserResultDataType<typeof action2Num2>>>();
    assertType<TypeEq<42, ParserResultDataType<typeof action3Num1>>>();
    assertType<TypeEq<42, ParserResultDataType<typeof action3Num2>>>();
    assertType<TypeEq<undefined, ParserResultDataType<typeof action1Undef1>>>();
    assertType<TypeEq<undefined, ParserResultDataType<typeof action1Undef2>>>();
    assertType<TypeEq<typeof fn, ParserResultDataType<typeof action1Fn1>>>();
    assertType<TypeEq<typeof fn, ParserResultDataType<typeof action1Fn2>>>();
    assertType<TypeEq<{}, ParserResultDataType<typeof action1Obj1>>>();
    assertType<TypeEq<{}, ParserResultDataType<typeof action1Obj2>>>();
});
