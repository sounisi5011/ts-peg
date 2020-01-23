import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator } from '../../../src';

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

    t.deepEqual(exp1.tryParse('abc', 0), {
        offsetEnd: 1,
        data: 42,
    });
    t.deepEqual(exp2.tryParse('abc', 0), {
        offsetEnd: 3,
        data: ['foo', 'foo', 'foo'],
    });
    t.deepEqual(exp3.tryParse('🐉💭😋🏡', 0), {
        offsetEnd: 8,
        data: num,
    });
    t.deepEqual(exp4.tryParse('bar', 0), {
        offsetEnd: 3,
        data: [null, null, null],
    });
    t.deepEqual(exp5.tryParse('hoge', 0), {
        offsetEnd: 2,
        data: [undefined, undefined],
    });
    t.deepEqual(exp6.tryParse('abc', 1), {
        offsetEnd: 2,
        data: true,
    });
    t.deepEqual(exp7.tryParse('abc', 2), {
        offsetEnd: 3,
        data: false,
    });

    assertType<TypeEq<typeof exp1, Parser<42>>>();
    assertType<TypeEq<typeof exp2, Parser<['foo', ...'foo'[]]>>>();
    assertType<TypeEq<typeof exp3, Parser<number>>>();
    assertType<TypeEq<typeof exp4, Parser<[null, ...null[]]>>>();
    assertType<TypeEq<typeof exp5, Parser<[undefined, undefined]>>>();
    assertType<TypeEq<typeof exp6, Parser<true>>>();
    assertType<TypeEq<typeof exp7, Parser<false>>>();
    assertType<TypeEq<typeof exp8, Parser<1 | '2' | true>>>();
    assertType<
        TypeEq<
            typeof exp9,
            Parser<[boolean, null, undefined, number, string, number]>
        >
    >();
    assertType<
        TypeEq<
            typeof exp10,
            Parser<readonly [false, null, undefined, 42, 'hoge', number]>
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

    assertType<TypeEq<typeof action1Num1, Parser<42>>>();
    assertType<TypeEq<typeof action1Num2, Parser<42>>>();
    assertType<TypeEq<typeof action2Num1, Parser<42>>>();
    assertType<TypeEq<typeof action2Num2, Parser<42>>>();
    assertType<TypeEq<typeof action3Num1, Parser<42>>>();
    assertType<TypeEq<typeof action3Num2, Parser<42>>>();
    assertType<TypeEq<typeof action1Undef1, Parser<undefined>>>();
    assertType<TypeEq<typeof action1Undef2, Parser<undefined>>>();
    assertType<TypeEq<typeof action1Fn1, Parser<typeof fn>>>();
    assertType<TypeEq<typeof action1Fn2, Parser<typeof fn>>>();
    assertType<TypeEq<typeof action1Obj1, Parser<{}>>>();
    assertType<TypeEq<typeof action1Obj2, Parser<{}>>>();
});
