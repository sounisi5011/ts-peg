import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, {
    ActionExecutionEnvironment,
    Parser,
    ParserGenerator,
    ParserResultDataType,
} from '../../../src';
import { parse } from '../../helpers/parser';

test('should unmatch', t => {
    t.is(parse(p.any.unmatch(p.chars('0-9')), 'abc')?.data, 'a');
    t.is(parse(p.any.unmatch(p.chars('0-9')), 'abc')?.offsetEnd, 1);
    t.is(
        parse(
            p.any.unmatch(char => /[0-9]/.test(char)),
            'abc',
        )?.data,
        'a',
    );
    t.is(
        parse(
            p.any.unmatch(char => /[0-9]/.test(char)),
            'abc',
        )?.offsetEnd,
        1,
    );

    t.deepEqual(parse(p.any.times(2).unmatch(p.str('a')), 'abc')?.data, [
        'a',
        'b',
    ]);
    t.deepEqual(parse(p.any.times(2).unmatch(p.str('abcd')), 'abc')?.data, [
        'a',
        'b',
    ]);
    t.deepEqual(parse(p.any.times(2).unmatch(p.str('abc')), 'abc')?.data, [
        'a',
        'b',
    ]);
    t.deepEqual(
        parse(p.any.times(2).unmatch(p.or('xy', 'abcd')), 'abc')?.data,
        ['a', 'b'],
    );
    t.deepEqual(parse(p.any.times(2).unmatch(p.or('abc', 'a')), 'abc')?.data, [
        'a',
        'b',
    ]);
});

test('should not unmatch', t => {
    t.is(parse(p.any.unmatch(p.chars('0-9')), '012')?.data, undefined);
    t.is(
        parse(
            p.any.unmatch(char => /[a-z]/.test(char)),
            'abc',
        )?.data,
        undefined,
    );

    t.is(parse(p.any.times(2).unmatch(p.str('ab')), 'abc')?.data, undefined);
    t.is(
        parse(p.any.times(2).unmatch(p.or('abcd', 'abc', 'ab')), 'abc')?.data,
        undefined,
    );
});

test('should fail by invalid arguments', t => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */

    t.throws(
        // @ts-ignore
        () => p.any.unmatch(),
        {
            instanceOf: Error,
            message: 'one argument required',
        },
    );

    for (const arg of [
        null,
        undefined,
        true,
        false,
        42,
        'x',
        ['y'],
        [p.any],
        () => true,
        /regex/,
        Symbol(''),
        p.any,
    ]) {
        const message = util.inspect({ arg }, { breakLength: Infinity });
        if (typeof arg === 'function' || arg instanceof Parser) {
            t.notThrows(() => p.any.unmatch(arg), message);
        } else {
            t.throws(
                // @ts-ignore
                () => p.any.unmatch(arg),
                {
                    instanceOf: TypeError,
                    message:
                        'only the Parser object or function can be specified as argument',
                },
                message,
            );
        }
        if (typeof arg === 'boolean') {
            t.notThrows(
                () => p.any.unmatch(() => arg).tryParse('foo', 0, Infinity),
                message,
            );
        } else {
            t.throws(
                // @ts-ignore
                () => p.any.unmatch(() => arg).tryParse('foo', 0, Infinity),
                {
                    instanceOf: TypeError,
                    message:
                        'the value returned by callback function must be a boolean',
                },
                message,
            );
        }
    }

    /* eslint-enable */
});

test('validate unmatch predicate arguments', t => {
    t.plan(7);

    p.any
        .unmatch((...args) => {
            t.is(args[0], 'a');
            assertType<
                TypeEq<typeof args, [string, ActionExecutionEnvironment]>
            >();
            return false;
        })
        .tryParse('abc', 0, Infinity);
    p.str('a')
        .unmatch((...args) => {
            t.is(args[0], 'a');
            assertType<
                TypeEq<typeof args, ['a', ActionExecutionEnvironment]>
            >();
            return false;
        })
        .tryParse('abc', 0, Infinity);

    p.any.zeroOrMore
        .unmatch((...args) => {
            t.deepEqual(args[0], ['a', 'b', 'c']);
            assertType<
                TypeEq<typeof args, [string[], ActionExecutionEnvironment]>
            >();
            return false;
        })
        .tryParse('abc', 0, Infinity);
    p.any.oneOrMore
        .unmatch((...args) => {
            t.deepEqual(args[0], ['a', 'b', 'c']);
            assertType<
                TypeEq<
                    typeof args,
                    [[string, ...string[]], ActionExecutionEnvironment]
                >
            >();
            return false;
        })
        .tryParse('abc', 0, Infinity);
    p.any.optional
        .unmatch((...args) => {
            t.deepEqual(args[0], 'a');
            assertType<
                TypeEq<
                    typeof args,
                    [string | undefined, ActionExecutionEnvironment]
                >
            >();
            return false;
        })
        .tryParse('abc', 0, Infinity);

    p.str('x')
        .zeroOrMore.unmatch((...args) => {
            t.deepEqual(args[0], []);
            assertType<
                TypeEq<typeof args, ['x'[], ActionExecutionEnvironment]>
            >();
            return false;
        })
        .tryParse('abc', 0, Infinity);
    p.str('x')
        .optional.unmatch((...args) => {
            t.deepEqual(args[0], undefined);
            assertType<
                TypeEq<
                    typeof args,
                    ['x' | undefined, ActionExecutionEnvironment]
                >
            >();
            return false;
        })
        .tryParse('abc', 0, Infinity);
});

test('should not invoke the callback function until start parsing', t => {
    t.plan(1);

    p.any.unmatch(() => {
        t.fail();
        return false;
    });

    p.any
        .unmatch(() => {
            t.pass();
            return false;
        })
        .tryParse('abc', 0, Infinity);
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const p1 = p;
    const p2 = new ParserGenerator();
    const fn1 = (): boolean => true;
    const fn2 = (): boolean => true;
    const p1Sfoo = p1.str('foo');
    const p2Sfoo = p2.str('foo');
    const unmatchP1Sfoo = p1.any.unmatch(p1Sfoo);
    const unmatchP1Fn1 = p1.any.unmatch(fn1);
    const unmatchP1Fn2 = p1.any.unmatch(fn2);
    const unmatchP2Fn2 = p2.any.unmatch(fn2);

    t.is(unmatchP1Sfoo, p1.any.unmatch(p1Sfoo));
    t.is(unmatchP1Sfoo, p1.any.unmatch(p1.str('foo')));
    t.is(unmatchP1Fn1, p1.any.unmatch(fn1));
    t.is(unmatchP1Fn2, p1.any.unmatch(fn2));
    t.is(unmatchP2Fn2, p2.any.unmatch(fn2));

    t.not(unmatchP1Sfoo, p1.str('x').unmatch(p1Sfoo));
    t.not(unmatchP1Sfoo, p1.any.unmatch(p1.str('bar')));
    t.not(unmatchP1Sfoo, p1.any.unmatch(p2Sfoo));
    t.not(unmatchP1Fn1, unmatchP1Sfoo);
    t.not(unmatchP1Fn1, unmatchP1Fn2);
    t.not(
        unmatchP1Fn2,
        unmatchP2Fn2,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    assertType<TypeEq<string, ParserResultDataType<typeof unmatchP1Sfoo>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof unmatchP1Fn1>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof unmatchP1Fn2>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof unmatchP2Fn2>>>();

    const unmatchP1SfooSx = p1Sfoo.unmatch(p1.str('x'));
    const unmatchP1SfooOptSx = p1Sfoo.optional.unmatch(p1.str('x'));
    const unmatchP1SfooMoreSx = p1Sfoo.oneOrMore.unmatch(p1.str('x'));
    assertType<
        TypeEq<
            ParserResultDataType<typeof p1Sfoo>,
            ParserResultDataType<typeof unmatchP1SfooSx>
        >
    >();
    assertType<
        TypeEq<
            ParserResultDataType<typeof p1Sfoo['optional']>,
            ParserResultDataType<typeof unmatchP1SfooOptSx>
        >
    >();
    assertType<
        TypeEq<
            ParserResultDataType<typeof p1Sfoo['oneOrMore']>,
            ParserResultDataType<typeof unmatchP1SfooMoreSx>
        >
    >();
});
