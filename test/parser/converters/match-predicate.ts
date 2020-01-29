import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { ActionExecutionEnvironment, Parser } from '../../../src';

test('should match', t => {
    t.is(p.any.match(p.chars('a-z')).tryParse('abc', 0)?.data, 'a');
    t.is(p.any.match(char => /[a-z]/.test(char)).tryParse('abc', 0)?.data, 'a');
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
