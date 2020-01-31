import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../src';
import { parse } from '../helpers/parser';

test('should match', t => {
    {
        const parser = p.seq(p.any);
        t.deepEqual(parse(parser, 'abc')?.data, ['a']);
        assertType<TypeEq<[string], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq('a');
        t.deepEqual(parse(parser, 'abc')?.data, ['a']);
        assertType<TypeEq<['a'], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq(p.str('a'));
        assertType<TypeEq<['a'], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq(p.any, p.any);
        t.deepEqual(parse(parser, 'abc')?.data, ['a', 'b']);
        t.deepEqual(parse(parser, 'abc', 1)?.data, ['b', 'c']);
        assertType<
            TypeEq<[string, string], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq(p.any, 'b');
        t.deepEqual(parse(parser, 'abc')?.data, ['a', 'b']);
        t.deepEqual(parse(parser, 'abbc')?.data, ['a', 'b']);
        t.deepEqual(parse(parser, 'abbc', 1)?.data, ['b', 'b']);
        assertType<
            TypeEq<[string, 'b'], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq(p.any, p.str('b'));
        assertType<
            TypeEq<[string, 'b'], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq('a', p.str('b'));
        t.deepEqual(parse(parser, 'abc')?.data, ['a', 'b']);
        assertType<TypeEq<['a', 'b'], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq('x', p.str('x').optional, p.str('y'));
        t.deepEqual(parse(parser, 'xyz')?.data, ['x', undefined, 'y']);
        t.deepEqual(parse(parser, 'xxyz')?.data, ['x', 'x', 'y']);
        t.deepEqual(parse(parser, 'xxyz', 1)?.data, ['x', undefined, 'y']);
        assertType<
            TypeEq<
                ['x', 'x' | undefined, 'y'],
                ParserResultDataType<typeof parser>
            >
        >();
    }
});

test('should match ; callback func', t => {
    {
        const parser = p.seq(() => [p.any]);
        t.deepEqual(parse(parser, 'abc')?.data, ['a']);
        assertType<TypeEq<[string], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq(() => [p.any] as const);
        assertType<TypeEq<[string], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq(() => ['a']);
        t.deepEqual(parse(parser, 'abc')?.data, ['a']);
        assertType<TypeEq<[string], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq(() => ['a'] as const);
        assertType<TypeEq<['a'], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq(() => [p.any, p.any]);
        t.deepEqual(parse(parser, 'abc')?.data, ['a', 'b']);
        t.deepEqual(parse(parser, 'abc', 1)?.data, ['b', 'c']);
        assertType<
            TypeEq<[string, string], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq(() => [p.any, p.any] as const);
        assertType<
            TypeEq<[string, string], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq(() => [p.any, 'b']);
        t.deepEqual(parse(parser, 'abc')?.data, ['a', 'b']);
        t.deepEqual(parse(parser, 'abbc')?.data, ['a', 'b']);
        t.deepEqual(parse(parser, 'abbc', 1)?.data, ['b', 'b']);
        assertType<
            TypeEq<[string, string], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq(() => [p.any, 'b'] as const);
        assertType<
            TypeEq<[string, 'b'], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq(() => ['a', p.str('b')]);
        t.deepEqual(parse(parser, 'abc')?.data, ['a', 'b']);
        assertType<
            TypeEq<[string, 'b'], ParserResultDataType<typeof parser>>
        >();
    }
    {
        const parser = p.seq(() => ['a', p.str('b')] as const);
        assertType<TypeEq<['a', 'b'], ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.seq(() => ['x', p.str('x').optional, p.str('y')]);
        t.deepEqual(parse(parser, 'xyz')?.data, ['x', undefined, 'y']);
        t.deepEqual(parse(parser, 'xxyz')?.data, ['x', 'x', 'y']);
        t.deepEqual(parse(parser, 'xxyz', 1)?.data, ['x', undefined, 'y']);
        assertType<
            TypeEq<
                [string, 'x' | undefined, 'y'],
                ParserResultDataType<typeof parser>
            >
        >();
    }
    {
        const parser = p.seq(
            () => ['x', p.str('x').optional, p.str('y')] as const,
        );
        assertType<
            TypeEq<
                ['x', 'x' | undefined, 'y'],
                ParserResultDataType<typeof parser>
            >
        >();
    }
});

test('should not match', t => {
    {
        const parser = p.seq(p.any);
        t.is(parse(parser, ''), undefined);
    }
    {
        const parser = p.seq('a');
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
    }
    {
        const parser = p.seq(p.any, p.any);
        t.is(parse(parser, 'abc', 2), undefined);
    }
    {
        const parser = p.seq(p.any, 'b');
        t.is(parse(parser, 'aβc'), undefined);
    }
    {
        const parser = p.seq('a', p.str('b'));
        t.is(parse(parser, 'Abc'), undefined);
        t.is(parse(parser, 'aac'), undefined);
        t.is(parse(parser, 'abc', 1), undefined);
    }
    {
        const parser = p.seq('x', p.str('x').optional, p.str('y'));
        t.is(parse(parser, 'xyz', 1), undefined);
        t.is(parse(parser, 'Xyz'), undefined);
        t.is(parse(parser, 'x yz'), undefined);
        t.is(parse(parser, 'xxxyz'), undefined);
    }
    t.is(parse(p.seq(p.any, p.any), 'abc', 0, 1), undefined);
    t.is(parse(p.seq(p.any, p.any), 'abc', 0, 0), undefined);
});

test('should not match ; callback func', t => {
    {
        const parser = p.seq(() => [p.any]);
        t.is(parse(parser, ''), undefined);
    }
    {
        const parser = p.seq(() => ['a']);
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
    }
    {
        const parser = p.seq(() => [p.any, p.any]);
        t.is(parse(parser, 'abc', 2), undefined);
    }
    {
        const parser = p.seq(() => [p.any, 'b'] as const);
        t.is(parse(parser, 'aβc'), undefined);
    }
    {
        const parser = p.seq(() => ['a', p.str('b')]);
        t.is(parse(parser, 'Abc'), undefined);
        t.is(parse(parser, 'aac'), undefined);
        t.is(parse(parser, 'abc', 1), undefined);
    }
    {
        const parser = p.seq(() => ['x', p.str('x').optional, p.str('y')]);
        t.is(parse(parser, 'xyz', 1), undefined);
        t.is(parse(parser, 'Xyz'), undefined);
        t.is(parse(parser, 'x yz'), undefined);
        t.is(parse(parser, 'xxxyz'), undefined);
    }
    t.is(
        parse(
            p.seq(() => [p.any, p.any]),
            'abc',
            0,
            1,
        ),
        undefined,
    );
    t.is(
        parse(
            p.seq(() => [p.any, p.any]),
            'abc',
            0,
            0,
        ),
        undefined,
    );
});

test('should fail by invalid arguments', t => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */

    t.throws(
        // @ts-ignore
        () => p.seq(),
        {
            instanceOf: Error,
            message: 'one or more arguments are required',
        },
    );
    t.throws(
        // @ts-ignore
        () => p.seq(() => []).tryParse('foo', 0, Infinity),
        {
            instanceOf: Error,
            message:
                'one or more values are required in the array returned by callback function',
        },
    );
    t.throws(
        // @ts-ignore
        () => p.seq(() => ['foo'], 'bar'),
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
            () => p.seq(arg),
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
            () => p.seq('x', arg),
            {
                instanceOf: TypeError,
                message:
                    'only the Parser object or string can be specified for the second argument and the subsequent arguments',
            },
            message,
        );
        t.throws(
            // @ts-ignore
            () => p.seq(() => [arg]).tryParse('foo', 0, Infinity),
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
                () => p.seq(() => arg).tryParse('foo', 0, Infinity),
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

    p.seq(() => {
        t.fail();
        return ['hoge'];
    });

    p.seq(() => {
        t.pass();
        return ['fuga'];
    }).tryParse('', 0, Infinity);
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const parserSfoo = p.str('foo');
    const parserSbar = p.str('bar');
    const expsFn1 = () => ['x-', parserSfoo, '-', p.any] as const;
    const expsFn2 = () => [parserSfoo, '-', parserSbar] as const;
    const expsFn3 = () => ['x-', parserSfoo, '-', p.any] as const;

    const p2 = new ParserGenerator();
    const seqP1Sfoo = p.seq(parserSfoo);
    const seqP1Sbar = p.seq(parserSbar);
    const seqP1SfooSfoo = p.seq(parserSfoo, parserSfoo);
    const seqP1SfooSbar = p.seq(parserSfoo, parserSbar);
    const seqP1SbarSfoo = p.seq(parserSbar, parserSfoo);
    const seqP1Fn1 = p.seq(expsFn1);
    const seqP1Fn2 = p.seq(expsFn2);
    const seqP1Fn3 = p.seq(expsFn3);
    const seqP1Shoge = p.seq('hoge');
    const seqP2Shoge = p2.seq('hoge');
    const orP1Shoge = p.or('hoge');

    // seqP1Sfoo
    t.is(seqP1Sfoo, p.seq(parserSfoo));
    t.is(seqP1Sfoo, p.seq(p.str('foo')));
    t.is<Parser<[string]>>(seqP1Sfoo, p.seq('foo'));
    // seqP1Sbar
    t.is(seqP1Sbar, p.seq(parserSbar));
    t.is(seqP1Sbar, p.seq(p.str('bar')));
    t.is<Parser<[string]>>(seqP1Sbar, p.seq('bar'));
    // seqP1SfooSfoo
    t.is(seqP1SfooSfoo, p.seq(parserSfoo, parserSfoo));
    t.is(seqP1SfooSfoo, p.seq(parserSfoo, p.str('foo')));
    t.is<Parser<[string, string]>>(seqP1SfooSfoo, p.seq(parserSfoo, 'foo'));
    t.is(seqP1SfooSfoo, p.seq(p.str('foo'), parserSfoo));
    t.is(seqP1SfooSfoo, p.seq(p.str('foo'), p.str('foo')));
    t.is<Parser<[string, string]>>(seqP1SfooSfoo, p.seq(p.str('foo'), 'foo'));
    t.is<Parser<[string, string]>>(seqP1SfooSfoo, p.seq('foo', parserSfoo));
    t.is<Parser<[string, string]>>(seqP1SfooSfoo, p.seq('foo', p.str('foo')));
    t.is<Parser<[string, string]>>(seqP1SfooSfoo, p.seq('foo', 'foo'));
    // seqP1SfooSbar
    t.is(seqP1SfooSbar, p.seq(parserSfoo, parserSbar));
    t.is(seqP1SfooSbar, p.seq(parserSfoo, p.str('bar')));
    t.is<Parser<[string, string]>>(seqP1SfooSbar, p.seq(parserSfoo, 'bar'));
    t.is(seqP1SfooSbar, p.seq(p.str('foo'), parserSbar));
    t.is(seqP1SfooSbar, p.seq(p.str('foo'), p.str('bar')));
    t.is<Parser<[string, string]>>(seqP1SfooSbar, p.seq(p.str('foo'), 'bar'));
    t.is<Parser<[string, string]>>(seqP1SfooSbar, p.seq('foo', parserSbar));
    t.is<Parser<[string, string]>>(seqP1SfooSbar, p.seq('foo', p.str('bar')));
    t.is<Parser<[string, string]>>(seqP1SfooSbar, p.seq('foo', 'bar'));
    // seqP1SbarSfoo
    t.is(seqP1SbarSfoo, p.seq(parserSbar, parserSfoo));
    t.is(seqP1SbarSfoo, p.seq(parserSbar, p.str('foo')));
    t.is<Parser<[string, string]>>(seqP1SbarSfoo, p.seq(parserSbar, 'foo'));
    t.is(seqP1SbarSfoo, p.seq(p.str('bar'), parserSfoo));
    t.is(seqP1SbarSfoo, p.seq(p.str('bar'), p.str('foo')));
    t.is<Parser<[string, string]>>(seqP1SbarSfoo, p.seq(p.str('bar'), 'foo'));
    t.is<Parser<[string, string]>>(seqP1SbarSfoo, p.seq('bar', parserSfoo));
    t.is<Parser<[string, string]>>(seqP1SbarSfoo, p.seq('bar', p.str('foo')));
    t.is<Parser<[string, string]>>(seqP1SbarSfoo, p.seq('bar', 'foo'));
    // seqP1Fn1 ~ seqP1Fn3
    t.is(seqP1Fn1, p.seq(expsFn1));
    t.is(seqP1Fn2, p.seq(expsFn2));
    t.is(seqP1Fn3, p.seq(expsFn3));
    // seqP1Shoge
    t.is(seqP1Shoge, p.seq('hoge'));
    t.is<Parser<[string]>>(seqP1Shoge, p.seq(p.str('hoge')));
    // seqP2Shoge
    t.is(seqP2Shoge, p2.seq('hoge'));
    // orP1Shoge
    t.is(orP1Shoge, p.or('hoge'));

    t.not<Parser<[string]>>(seqP1Sfoo, seqP1Sbar);
    t.not<Parser<[string, string]>>(seqP1SfooSfoo, seqP1SfooSbar);
    t.not<Parser<[string, string]>>(seqP1SfooSbar, seqP1SbarSfoo);
    t.not<Parser<string[]>>(seqP1Fn1, seqP1Fn2);
    t.not(seqP1Fn1, seqP1Fn3);
    t.not(
        seqP1Shoge,
        seqP2Shoge,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not<Parser<[string] | string>>(seqP1Shoge, orP1Shoge);

    assertType<TypeEq<['foo'], ParserResultDataType<typeof seqP1Sfoo>>>();
    assertType<TypeEq<['bar'], ParserResultDataType<typeof seqP1Sbar>>>();
    assertType<
        TypeEq<
            ['x-', 'foo', '-', string],
            ParserResultDataType<typeof seqP1Fn1>
        >
    >();
    assertType<
        TypeEq<['foo', '-', 'bar'], ParserResultDataType<typeof seqP1Fn2>>
    >();
    assertType<
        TypeEq<
            ['x-', 'foo', '-', string],
            ParserResultDataType<typeof seqP1Fn3>
        >
    >();
    assertType<TypeEq<['hoge'], ParserResultDataType<typeof seqP1Shoge>>>();
    assertType<TypeEq<['hoge'], ParserResultDataType<typeof seqP2Shoge>>>();
});
