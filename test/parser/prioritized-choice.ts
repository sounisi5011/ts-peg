import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../src';

test('should match', t => {
    {
        const parser1 = p.or(p.any);
        const parser2 = p.or(() => [p.any] as const);
        const parser3 = p.or(() => [p.any]);

        t.deepEqual(parser1.tryParse('abc', 0)?.data, 'a');
        t.deepEqual(parser2.tryParse('abc', 0)?.data, 'a');

        assertType<TypeEq<string, ParserResultDataType<typeof parser1>>>();
        assertType<TypeEq<string, ParserResultDataType<typeof parser2>>>();
        assertType<TypeEq<string, ParserResultDataType<typeof parser3>>>();
    }
    {
        const parser1 = p.or('ba', 'a', 'b', 'D');
        const parser2 = p.or(() => ['ba', 'a', 'b', 'D'] as const);
        const parser3 = p.or(() => ['ba', 'a', 'b', 'D']);

        t.deepEqual(parser1.tryParse('acid', 0)?.data, 'a');
        t.deepEqual(parser2.tryParse('acid', 0)?.data, 'a');

        t.deepEqual(parser1.tryParse('blood', 0)?.data, 'b');
        t.deepEqual(parser2.tryParse('blood', 0)?.data, 'b');

        t.deepEqual(parser1.tryParse('Digestion', 0)?.data, 'D');
        t.deepEqual(parser2.tryParse('Digestion', 0)?.data, 'D');

        t.deepEqual(parser1.tryParse('ababababa', 0)?.data, 'a');
        t.deepEqual(parser2.tryParse('ababababa', 0)?.data, 'a');

        t.deepEqual(parser1.tryParse('ababababa', 1)?.data, 'ba');
        t.deepEqual(parser2.tryParse('ababababa', 1)?.data, 'ba');

        assertType<
            TypeEq<'ba' | 'a' | 'b' | 'D', ParserResultDataType<typeof parser1>>
        >();
        assertType<
            TypeEq<'ba' | 'a' | 'b' | 'D', ParserResultDataType<typeof parser2>>
        >();
        assertType<TypeEq<string, ParserResultDataType<typeof parser3>>>();
    }
    {
        const parser1 = p.or('swallow', 'vore');
        const parser2 = p.or(() => ['swallow', 'vore'] as const);
        const parser3 = p.or(() => ['swallow', 'vore']);

        t.is(parser1.tryParse('vore - vorarephilia', 0)?.data, 'vore');
        t.is(parser2.tryParse('vore - vorarephilia', 0)?.data, 'vore');

        t.is(
            parser1.tryParse('bad dragon swallowed the princess', 11)?.data,
            'swallow',
        );
        t.is(
            parser2.tryParse('bad dragon swallowed the princess', 11)?.data,
            'swallow',
        );

        assertType<
            TypeEq<'swallow' | 'vore', ParserResultDataType<typeof parser1>>
        >();
        assertType<
            TypeEq<'swallow' | 'vore', ParserResultDataType<typeof parser2>>
        >();
        assertType<TypeEq<string, ParserResultDataType<typeof parser3>>>();
    }
    {
        const parser1A = p.or(
            p.seq(p.chars('0-9'), '+', p.chars('0-9')),
            p.seq(p.chars('0-9')),
        );
        const parser2A = p.or(() => [
            p.seq(p.chars('0-9'), '+', p.chars('0-9')),
            p.seq(p.chars('0-9')),
        ]);
        const parser1B = p.or(
            p.seq(p.chars('0-9')),
            p.seq(p.chars('0-9'), '+', p.chars('0-9')),
        );
        const parser2B = p.or(() => [
            p.seq(p.chars('0-9')),
            p.seq(p.chars('0-9'), '+', p.chars('0-9')),
        ]);

        t.deepEqual(parser1A.tryParse('1+2', 0)?.data, ['1', '+', '2']);
        t.deepEqual(parser2A.tryParse('1+2', 0)?.data, ['1', '+', '2']);
        t.deepEqual(parser1B.tryParse('1+2', 0)?.data, ['1']);
        t.deepEqual(parser2B.tryParse('1+2', 0)?.data, ['1']);

        t.deepEqual(parser1A.tryParse('42', 0)?.data, ['4']);
        t.deepEqual(parser2A.tryParse('42', 0)?.data, ['4']);
        t.deepEqual(parser1B.tryParse('42', 0)?.data, ['4']);
        t.deepEqual(parser2B.tryParse('42', 0)?.data, ['4']);

        assertType<
            TypeEq<
                [string, '+', string] | [string],
                ParserResultDataType<typeof parser1A>
            >
        >();
        assertType<
            TypeEq<
                [string, '+', string] | [string],
                ParserResultDataType<typeof parser2A>
            >
        >();
        assertType<
            TypeEq<
                [string] | [string, '+', string],
                ParserResultDataType<typeof parser1B>
            >
        >();
        assertType<
            TypeEq<
                [string] | [string, '+', string],
                ParserResultDataType<typeof parser2B>
            >
        >();
    }
    {
        const parser1 = p.or(
            p.seq(p.chars('0-9'), p.or('+', '-'), p.chars('0-9')),
            p.seq(p.chars('0-9')),
        );
        const parser2 = p.or(() => [
            p.seq(p.chars('0-9'), p.or('+', '-'), p.chars('0-9')),
            p.seq(p.chars('0-9')),
        ]);

        t.deepEqual(parser1.tryParse('1+2', 0)?.data, ['1', '+', '2']);
        t.deepEqual(parser2.tryParse('1+2', 0)?.data, ['1', '+', '2']);

        t.deepEqual(parser1.tryParse('1-2', 0)?.data, ['1', '-', '2']);
        t.deepEqual(parser2.tryParse('1-2', 0)?.data, ['1', '-', '2']);

        t.deepEqual(parser1.tryParse('42', 0)?.data, ['4']);
        t.deepEqual(parser2.tryParse('42', 0)?.data, ['4']);

        assertType<
            TypeEq<
                [string, '+' | '-', string] | [string],
                ParserResultDataType<typeof parser1>
            >
        >();
        assertType<
            TypeEq<
                [string, '+' | '-', string] | [string],
                ParserResultDataType<typeof parser2>
            >
        >();
    }
});

test('should not match', t => {
    {
        const parser1 = p.or(p.any);
        const parser2 = p.or(() => [p.any]);

        t.is(parser1.tryParse('', 0), undefined);
        t.is(parser2.tryParse('', 0), undefined);
    }
    {
        const parser1 = p.or('a', 'b', 'c');
        const parser2 = p.or(() => ['a', 'b', 'c'] as const);

        t.is(parser1.tryParse('stomach', 0), undefined);
        t.is(parser2.tryParse('stomach', 0), undefined);
    }
    {
        const parser1 = p.or('swallow', 'vore');
        const parser2 = p.or(() => ['swallow', 'vore'] as const);

        t.is(parser1.tryParse('vore - vorarephilia', 1), undefined);
        t.is(parser2.tryParse('vore - vorarephilia', 1), undefined);

        t.is(parser1.tryParse('vote - typo!', 0), undefined);
        t.is(parser2.tryParse('vote - typo!', 0), undefined);

        t.is(
            parser1.tryParse('bad dragon swallowed the princess', 10),
            undefined,
        );
        t.is(
            parser2.tryParse('bad dragon swallowed the princess', 10),
            undefined,
        );

        t.is(
            parser1.tryParse('bad dragon swallowed the princess', 12),
            undefined,
        );
        t.is(
            parser2.tryParse('bad dragon swallowed the princess', 12),
            undefined,
        );
    }
});

test('should fail by invalid arguments', t => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */

    t.throws(
        // @ts-ignore
        () => p.or(),
        {
            instanceOf: Error,
            message: 'one or more arguments are required',
        },
    );
    t.throws(
        // @ts-ignore
        () => p.or(() => []).tryParse('foo', 0),
        {
            instanceOf: Error,
            message:
                'one or more values are required in the array returned by callback function',
        },
    );
    t.throws(
        // @ts-ignore
        () => p.or(() => ['foo'], 'bar'),
        {
            instanceOf: Error,
            message:
                'the second and subsequent arguments cannot be specified. the first argument is the callback function',
        },
    );

    for (const arg of [null, undefined, 42, ['x']]) {
        const message = util.inspect({ arg }, { breakLength: Infinity });
        t.throws(
            // @ts-ignore
            () => p.or(arg),
            {
                instanceOf: TypeError,
                message:
                    'only the Parser object, string or function can be specified as the first argument',
            },
            message,
        );
    }
    for (const arg of [null, undefined, 42, ['x'], () => ['y']]) {
        const message = util.inspect({ arg }, { breakLength: Infinity });
        t.throws(
            // @ts-ignore
            () => p.or('x', arg),
            {
                instanceOf: TypeError,
                message:
                    'only the Parser object or string can be specified for the second argument and the subsequent arguments',
            },
            message,
        );
        t.throws(
            // @ts-ignore
            () => p.or(() => [arg]).tryParse('foo', 0),
            {
                instanceOf: TypeError,
                message:
                    'the value returned by callback function must be an array with Parser objects or strings',
            },
            message,
        );
        if (!Array.isArray(arg)) {
            t.throws(
                // @ts-ignore
                () => p.or(() => arg).tryParse('foo', 0),
                {
                    instanceOf: TypeError,
                    message:
                        'the value returned by callback function must be an array with Parser objects or strings',
                },
                message,
            );
        }
    }

    /* eslint-enable */
});

test('should not invoke the callback function until start parsing', t => {
    t.plan(1);

    p.or(() => {
        t.fail();
        return ['hoge'];
    });

    p.or(() => {
        t.pass();
        return ['fuga'];
    }).tryParse('', 0);
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const parserSfoo = p.str('foo');
    const parserSbar = p.str('bar');
    const expsFn1 = () => ['x-', parserSfoo, '-', p.any] as const;
    const expsFn2 = () => [parserSfoo, '-', parserSbar] as const;
    const expsFn3 = () => ['x-', parserSfoo, '-', p.any] as const;

    const p2 = new ParserGenerator();
    const orP1Sfoo = p.or(parserSfoo);
    const orP1Sbar = p.or(parserSbar);
    const orP1SfooSfoo = p.or(parserSfoo, parserSfoo);
    const orP1SfooSbar = p.or(parserSfoo, parserSbar);
    const orP1SbarSfoo = p.or(parserSbar, parserSfoo);
    const orP1Fn1 = p.or(expsFn1);
    const orP1Fn2 = p.or(expsFn2);
    const orP1Fn3 = p.or(expsFn3);
    const orP1Shoge = p.or('hoge');
    const orP2Shoge = p2.or('hoge');
    const seqP1Shoge = p.seq('hoge');

    // orP1Sfoo
    t.is(orP1Sfoo, p.or(parserSfoo));
    t.is(orP1Sfoo, p.or(p.str('foo')));
    t.is<Parser<string>>(orP1Sfoo, p.or('foo'));
    // orP1Sbar
    t.is(orP1Sbar, p.or(parserSbar));
    t.is(orP1Sbar, p.or(p.str('bar')));
    t.is<Parser<string>>(orP1Sbar, p.or('bar'));
    // orP1SfooSfoo
    t.is(orP1SfooSfoo, p.or(parserSfoo, parserSfoo));
    t.is(orP1SfooSfoo, p.or(parserSfoo, p.str('foo')));
    t.is<Parser<string>>(orP1SfooSfoo, p.or(parserSfoo, 'foo'));
    t.is(orP1SfooSfoo, p.or(p.str('foo'), parserSfoo));
    t.is(orP1SfooSfoo, p.or(p.str('foo'), p.str('foo')));
    t.is<Parser<string>>(orP1SfooSfoo, p.or(p.str('foo'), 'foo'));
    t.is<Parser<string>>(orP1SfooSfoo, p.or('foo', parserSfoo));
    t.is<Parser<string>>(orP1SfooSfoo, p.or('foo', p.str('foo')));
    t.is<Parser<string>>(orP1SfooSfoo, p.or('foo', 'foo'));
    // orP1SfooSbar
    t.is(orP1SfooSbar, p.or(parserSfoo, parserSbar));
    t.is(orP1SfooSbar, p.or(parserSfoo, p.str('bar')));
    t.is<Parser<string>>(orP1SfooSbar, p.or(parserSfoo, 'bar'));
    t.is(orP1SfooSbar, p.or(p.str('foo'), parserSbar));
    t.is(orP1SfooSbar, p.or(p.str('foo'), p.str('bar')));
    t.is<Parser<string>>(orP1SfooSbar, p.or(p.str('foo'), 'bar'));
    t.is<Parser<string>>(orP1SfooSbar, p.or('foo', parserSbar));
    t.is<Parser<string>>(orP1SfooSbar, p.or('foo', p.str('bar')));
    t.is<Parser<string>>(orP1SfooSbar, p.or('foo', 'bar'));
    // orP1SbarSfoo
    t.is(orP1SbarSfoo, p.or(parserSbar, parserSfoo));
    t.is(orP1SbarSfoo, p.or(parserSbar, p.str('foo')));
    t.is<Parser<string>>(orP1SbarSfoo, p.or(parserSbar, 'foo'));
    t.is(orP1SbarSfoo, p.or(p.str('bar'), parserSfoo));
    t.is(orP1SbarSfoo, p.or(p.str('bar'), p.str('foo')));
    t.is<Parser<string>>(orP1SbarSfoo, p.or(p.str('bar'), 'foo'));
    t.is<Parser<string>>(orP1SbarSfoo, p.or('bar', parserSfoo));
    t.is<Parser<string>>(orP1SbarSfoo, p.or('bar', p.str('foo')));
    t.is<Parser<string>>(orP1SbarSfoo, p.or('bar', 'foo'));
    // orP1Fn1 ~ orP1Fn3
    t.is(orP1Fn1, p.or(expsFn1));
    t.is(orP1Fn2, p.or(expsFn2));
    t.is(orP1Fn3, p.or(expsFn3));
    // orP1Shoge
    t.is(orP1Shoge, p.or('hoge'));
    t.is<Parser<string>>(orP1Shoge, p.or(p.str('hoge')));
    // orP2Shoge
    t.is(orP2Shoge, p2.or('hoge'));
    // seqP1Shoge
    t.is(seqP1Shoge, p.seq('hoge'));

    t.not<Parser<string>>(orP1Sfoo, orP1Sbar);
    t.not<Parser<string>>(orP1SfooSfoo, orP1SfooSbar);
    t.not<Parser<string>>(orP1SfooSbar, orP1SbarSfoo);
    t.not<Parser<string>>(orP1Fn1, orP1Fn2);
    t.not(orP1Fn1, orP1Fn3);
    t.not(
        orP1Shoge,
        orP2Shoge,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not<Parser<string | [string]>>(orP1Shoge, seqP1Shoge);

    assertType<TypeEq<'foo', ParserResultDataType<typeof orP1Sfoo>>>();
    assertType<TypeEq<'bar', ParserResultDataType<typeof orP1Sbar>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof orP1Fn1>>>();
    assertType<
        TypeEq<'foo' | '-' | 'bar', ParserResultDataType<typeof orP1Fn2>>
    >();
    assertType<TypeEq<string, ParserResultDataType<typeof orP1Fn3>>>();
    assertType<TypeEq<'hoge', ParserResultDataType<typeof orP1Shoge>>>();
    assertType<TypeEq<'hoge', ParserResultDataType<typeof orP2Shoge>>>();
});
