import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { Parser, ParserResultDataType } from '../../src';
import { parse } from '../helpers/parser';

test('should match', t => {
    {
        const parser = p.not_a(p.any);
        const result = parse(parser, 'abc', 3);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 3);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => p.any);
        const result = parse(parser, 'abc', 3);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 3);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a('a');
        const result = parse(parser, 'abc', 1);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 1);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(p.str('a'));
        const result = parse(parser, 'abc', 1);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 1);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => p.str('a'));
        const result = parse(parser, 'abc', 1);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 1);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a('bc');
        const result = parse(parser, 'abc');
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(p.str('bc'));
        const result = parse(parser, 'abc');
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => p.str('bc'));
        const result = parse(parser, 'abc');
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(() => false);
        const result = parse(parser, 'abc');
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 0);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.not_a(env => env.offset < env.input.length);
        const result = parse(parser, 'abc', 3);
        t.is(result?.data, null);
        t.is(result?.offsetEnd, 3);
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
});

test('should not match', t => {
    {
        const parser = p.not_a(p.any);
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
    }
    {
        const parser = p.not_a(() => p.any);
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
    }
    {
        const parser = p.not_a('a');
        t.is(parse(parser, 'abc'), undefined);
    }
    {
        const parser = p.not_a(p.str('a'));
        t.is(parse(parser, 'abc'), undefined);
    }
    {
        const parser = p.not_a(() => p.str('a'));
        t.is(parse(parser, 'abc'), undefined);
    }
    {
        const parser = p.not_a('bc');
        t.is(parse(parser, 'abc', 1), undefined);
    }
    {
        const parser = p.not_a(p.str('bc'));
        t.is(parse(parser, 'abc', 1), undefined);
    }
    {
        const parser = p.not_a(() => p.str('bc'));
        t.is(parse(parser, 'abc', 1), undefined);
    }
    {
        const parser = p.not_a(() => true);
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.not_a(env => env.offset < env.input.length);
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
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
