import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, {
    ActionExecutionEnvironment,
    Parser,
    ParserGenerator,
    ParserResultDataType,
} from '../../../src';

test('should match', t => {
    t.is(p.any.match(p.chars('a-z')).tryParse('abc', 0)?.data, 'a');
    t.is(p.any.match(p.chars('a-z')).tryParse('abc', 0)?.offsetEnd, 1);
    t.is(p.any.match(char => /[a-z]/.test(char)).tryParse('abc', 0)?.data, 'a');
    t.is(
        p.any.match(char => /[a-z]/.test(char)).tryParse('abc', 0)?.offsetEnd,
        1,
    );
});

test('should not match', t => {
    t.is(p.any.match(p.chars('a-z')).tryParse('ABC', 0)?.data, undefined);
    t.is(
        p.any.match(char => /[a-z]/.test(char)).tryParse('ABC', 0)?.data,
        undefined,
    );
});

test('should fail by invalid arguments', t => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */

    t.throws(
        // @ts-ignore
        () => p.any.match(),
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
        () => 'z',
        /regex/,
        Symbol(''),
        p.any,
    ]) {
        const message = util.inspect({ arg }, { breakLength: Infinity });
        if (typeof arg === 'function' || arg instanceof Parser) {
            // @ts-ignore
            t.notThrows(() => p.any.match(arg), message);
        } else {
            t.throws(
                // @ts-ignore
                () => p.any.match(arg),
                {
                    instanceOf: TypeError,
                    message:
                        'only the Parser object or function can be specified as argument',
                },
                message,
            );
        }
        if (typeof arg === 'boolean') {
            // @ts-ignore
            t.notThrows(
                () => p.any.match(() => arg).tryParse('foo', 0),
                message,
            );
        } else {
            t.throws(
                // @ts-ignore
                () => p.any.match(() => arg).tryParse('foo', 0),
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

test('validate match predicate arguments', t => {
    t.plan(7);

    p.any
        .match((...args) => {
            t.is(args[0], 'a');
            assertType<
                TypeEq<typeof args, [string, ActionExecutionEnvironment]>
            >();
            return true;
        })
        .tryParse('abc', 0);
    p.str('a')
        .match((...args) => {
            t.is(args[0], 'a');
            assertType<
                TypeEq<typeof args, ['a', ActionExecutionEnvironment]>
            >();
            return true;
        })
        .tryParse('abc', 0);

    p.any.zeroOrMore
        .match((...args) => {
            t.deepEqual(args[0], ['a', 'b', 'c']);
            assertType<
                TypeEq<typeof args, [string[], ActionExecutionEnvironment]>
            >();
            return true;
        })
        .tryParse('abc', 0);
    p.any.oneOrMore
        .match((...args) => {
            t.deepEqual(args[0], ['a', 'b', 'c']);
            assertType<
                TypeEq<
                    typeof args,
                    [[string, ...string[]], ActionExecutionEnvironment]
                >
            >();
            return true;
        })
        .tryParse('abc', 0);
    p.any.optional
        .match((...args) => {
            t.deepEqual(args[0], 'a');
            assertType<
                TypeEq<
                    typeof args,
                    [string | undefined, ActionExecutionEnvironment]
                >
            >();
            return true;
        })
        .tryParse('abc', 0);

    p.str('x')
        .zeroOrMore.match((...args) => {
            t.deepEqual(args[0], []);
            assertType<
                TypeEq<typeof args, ['x'[], ActionExecutionEnvironment]>
            >();
            return true;
        })
        .tryParse('abc', 0);
    p.str('x')
        .optional.match((...args) => {
            t.deepEqual(args[0], undefined);
            assertType<
                TypeEq<
                    typeof args,
                    ['x' | undefined, ActionExecutionEnvironment]
                >
            >();
            return true;
        })
        .tryParse('abc', 0);
});

test('should not invoke the callback function until start parsing', t => {
    t.plan(1);

    p.any.match(() => {
        t.fail();
        return true;
    });

    p.any
        .match(() => {
            t.pass();
            return true;
        })
        .tryParse('abc', 0);
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const p1 = p;
    const p2 = new ParserGenerator();
    const fn1 = (): boolean => true;
    const fn2 = (): boolean => true;
    const p1Sfoo = p1.str('foo');
    const p2Sfoo = p2.str('foo');
    const matchP1Sfoo = p1.any.match(p1Sfoo);
    const matchP1Fn1 = p1.any.match(fn1);
    const matchP1Fn2 = p1.any.match(fn2);
    const matchP2Fn2 = p2.any.match(fn2);

    t.is(matchP1Sfoo, p1.any.match(p1Sfoo));
    t.is(matchP1Sfoo, p1.any.match(p1.str('foo')));
    t.is(matchP1Fn1, p1.any.match(fn1));
    t.is(matchP1Fn2, p1.any.match(fn2));
    t.is(matchP2Fn2, p2.any.match(fn2));

    t.not(matchP1Sfoo, p1.str('x').match(p1Sfoo));
    t.not(matchP1Sfoo, p1.any.match(p1.str('bar')));
    t.not(matchP1Sfoo, p1.any.match(p2Sfoo));
    t.not(matchP1Fn1, matchP1Sfoo);
    t.not(matchP1Fn1, matchP1Fn2);
    t.not(
        matchP1Fn2,
        matchP2Fn2,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    assertType<TypeEq<string, ParserResultDataType<typeof matchP1Sfoo>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof matchP1Fn1>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof matchP1Fn2>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof matchP2Fn2>>>();

    const matchP1SfooSx = p1Sfoo.match(p1.str('x'));
    const matchP1SfooOptSx = p1Sfoo.optional.match(p1.str('x'));
    const matchP1SfooMoreSx = p1Sfoo.oneOrMore.match(p1.str('x'));
    assertType<
        TypeEq<
            ParserResultDataType<typeof p1Sfoo>,
            ParserResultDataType<typeof matchP1SfooSx>
        >
    >();
    assertType<
        TypeEq<
            ParserResultDataType<typeof p1Sfoo['optional']>,
            ParserResultDataType<typeof matchP1SfooOptSx>
        >
    >();
    assertType<
        TypeEq<
            ParserResultDataType<typeof p1Sfoo['oneOrMore']>,
            ParserResultDataType<typeof matchP1SfooMoreSx>
        >
    >();
});