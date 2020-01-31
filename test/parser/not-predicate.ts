import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { Parser, ParserResultDataType } from '../../src';

test('should match', t => {
    {
        const parser = p.not_a(p.any);
        const result = parser.tryParse('abc', 3, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 3);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => p.any);
        const result = parser.tryParse('abc', 3, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 3);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a('a');
        const result = parser.tryParse('abc', 1, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 1);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(p.str('a'));
        const result = parser.tryParse('abc', 1, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 1);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => p.str('a'));
        const result = parser.tryParse('abc', 1, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 1);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a('bc');
        const result = parser.tryParse('abc', 0, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(p.str('bc'));
        const result = parser.tryParse('abc', 0, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => p.str('bc'));
        const result = parser.tryParse('abc', 0, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => false);
        const result = parser.tryParse('abc', 0, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(env => env.offset < env.input.length);
        const result = parser.tryParse('abc', 3, Infinity);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 3);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
});

test('should not match', t => {
    {
        const parser = p.not_a(p.any);
        t.is(parser.tryParse('abc', 0, Infinity), undefined);
        t.is(parser.tryParse('abc', 1, Infinity), undefined);
        t.is(parser.tryParse('abc', 2, Infinity), undefined);
    }
    {
        const parser = p.not_a(() => p.any);
        t.is(parser.tryParse('abc', 0, Infinity), undefined);
        t.is(parser.tryParse('abc', 1, Infinity), undefined);
        t.is(parser.tryParse('abc', 2, Infinity), undefined);
    }
    {
        const parser = p.not_a('a');
        t.is(parser.tryParse('abc', 0, Infinity), undefined);
    }
    {
        const parser = p.not_a(p.str('a'));
        t.is(parser.tryParse('abc', 0, Infinity), undefined);
    }
    {
        const parser = p.not_a(() => p.str('a'));
        t.is(parser.tryParse('abc', 0, Infinity), undefined);
    }
    {
        const parser = p.not_a('bc');
        t.is(parser.tryParse('abc', 1, Infinity), undefined);
    }
    {
        const parser = p.not_a(p.str('bc'));
        t.is(parser.tryParse('abc', 1, Infinity), undefined);
    }
    {
        const parser = p.not_a(() => p.str('bc'));
        t.is(parser.tryParse('abc', 1, Infinity), undefined);
    }
    {
        const parser = p.not_a(() => true);
        t.is(parser.tryParse('abc', 0, Infinity), undefined);
        t.is(parser.tryParse('abc', 1, Infinity), undefined);
        t.is(parser.tryParse('abc', 2, Infinity), undefined);
        t.is(parser.tryParse('abc', 3, Infinity), undefined);
    }
    {
        const parser = p.not_a(env => env.offset < env.input.length);
        t.is(parser.tryParse('abc', 0, Infinity), undefined);
        t.is(parser.tryParse('abc', 1, Infinity), undefined);
        t.is(parser.tryParse('abc', 2, Infinity), undefined);
    }
});

test('should fail by invalid arguments', t => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */

    t.throws(
        // @ts-ignore
        () => p.not_a(),
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
        if (
            ['string', 'function'].includes(typeof arg) ||
            arg instanceof Parser
        ) {
            // @ts-ignore
            t.notThrows(() => p.not_a(arg), message);
        } else {
            t.throws(
                // @ts-ignore
                () => p.not_a(arg),
                {
                    instanceOf: TypeError,
                    message:
                        'only the Parser object, string or function can be specified as argument',
                },
                message,
            );
        }
        if (typeof arg === 'boolean' || arg instanceof Parser) {
            t.notThrows(
                // @ts-ignore
                () => p.not_a(() => arg).tryParse('foo', 0, Infinity),
                message,
            );
        } else {
            t.throws(
                // @ts-ignore
                () => p.not_a(() => arg).tryParse('foo', 0, Infinity),
                {
                    instanceOf: TypeError,
                    message:
                        'the value returned by callback function must be a Parser object or boolean',
                },
                message,
            );
        }
    }

    /* eslint-enable */
});

test('should not invoke the callback function until start parsing', t => {
    t.plan(1);

    p.not_a(() => {
        t.fail();
        return p.any;
    });

    p.not_a(() => {
        t.pass();
        return p.any;
    }).tryParse('', 0, Infinity);
});
