import test from 'ava';
import util from 'util';

import p, { Parser, ParserGenerator } from '../../src';
import { assertExtendType } from '../helpers/type';

test('should match', t => {
    {
        const parser = p.seq(p.any);
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a']);
        assertExtendType<Parser<[string]>, typeof parser>();
    }
    {
        const parser = p.seq('a');
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a']);
        assertExtendType<Parser<['a']>, typeof parser>();
    }
    {
        const parser = p.seq(p.str('a'));
        assertExtendType<Parser<['a']>, typeof parser>();
    }
    {
        const parser = p.seq(p.any, p.any);
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a', 'b']);
        t.deepEqual(parser.tryParse('abc', 1)?.data, ['b', 'c']);
        assertExtendType<Parser<[string, string]>, typeof parser>();
    }
    {
        const parser = p.seq(p.any, 'b');
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a', 'b']);
        t.deepEqual(parser.tryParse('abbc', 0)?.data, ['a', 'b']);
        t.deepEqual(parser.tryParse('abbc', 1)?.data, ['b', 'b']);
        assertExtendType<Parser<[string, 'b']>, typeof parser>();
    }
    {
        const parser = p.seq(p.any, p.str('b'));
        assertExtendType<Parser<[string, 'b']>, typeof parser>();
    }
    {
        const parser = p.seq('a', p.str('b'));
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a', 'b']);
        assertExtendType<Parser<['a', 'b']>, typeof parser>();
    }
    {
        const parser = p.seq('x', p.str('x').optional, p.str('y'));
        t.deepEqual(parser.tryParse('xyz', 0)?.data, ['x', undefined, 'y']);
        t.deepEqual(parser.tryParse('xxyz', 0)?.data, ['x', 'x', 'y']);
        t.deepEqual(parser.tryParse('xxyz', 1)?.data, ['x', undefined, 'y']);
        assertExtendType<Parser<['x', 'x' | undefined, 'y']>, typeof parser>();
    }
});

test('should match ; callback func', t => {
    {
        const parser = p.seq(() => [p.any]);
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a']);
        assertExtendType<Parser<[string]>, typeof parser>();
    }
    {
        const parser = p.seq(() => [p.any] as const);
        assertExtendType<Parser<[string]>, typeof parser>();
    }
    {
        const parser = p.seq(() => ['a']);
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a']);
        assertExtendType<Parser<[string]>, typeof parser>();
    }
    {
        const parser = p.seq(() => ['a'] as const);
        assertExtendType<Parser<['a']>, typeof parser>();
    }
    {
        const parser = p.seq(() => [p.any, p.any]);
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a', 'b']);
        t.deepEqual(parser.tryParse('abc', 1)?.data, ['b', 'c']);
        assertExtendType<Parser<[string, string]>, typeof parser>();
    }
    {
        const parser = p.seq(() => [p.any, p.any] as const);
        assertExtendType<Parser<[string, string]>, typeof parser>();
    }
    {
        const parser = p.seq(() => [p.any, 'b']);
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a', 'b']);
        t.deepEqual(parser.tryParse('abbc', 0)?.data, ['a', 'b']);
        t.deepEqual(parser.tryParse('abbc', 1)?.data, ['b', 'b']);
        assertExtendType<Parser<[string, string]>, typeof parser>();
    }
    {
        const parser = p.seq(() => [p.any, 'b'] as const);
        assertExtendType<Parser<[string, 'b']>, typeof parser>();
    }
    {
        const parser = p.seq(() => ['a', p.str('b')]);
        t.deepEqual(parser.tryParse('abc', 0)?.data, ['a', 'b']);
        assertExtendType<Parser<[string, 'b']>, typeof parser>();
    }
    {
        const parser = p.seq(() => ['a', p.str('b')] as const);
        assertExtendType<Parser<['a', 'b']>, typeof parser>();
    }
    {
        const parser = p.seq(() => ['x', p.str('x').optional, p.str('y')]);
        t.deepEqual(parser.tryParse('xyz', 0)?.data, ['x', undefined, 'y']);
        t.deepEqual(parser.tryParse('xxyz', 0)?.data, ['x', 'x', 'y']);
        t.deepEqual(parser.tryParse('xxyz', 1)?.data, ['x', undefined, 'y']);
        assertExtendType<
            Parser<[string, 'x' | undefined, 'y']>,
            typeof parser
        >();
    }
    {
        const parser = p.seq(
            () => ['x', p.str('x').optional, p.str('y')] as const,
        );
        assertExtendType<Parser<['x', 'x' | undefined, 'y']>, typeof parser>();
    }
});

test('should not match', t => {
    {
        const parser = p.seq(p.any);
        t.is(parser.tryParse('', 0), undefined);
    }
    {
        const parser = p.seq('a');
        t.is(parser.tryParse('abc', 1), undefined);
        t.is(parser.tryParse('abc', 2), undefined);
    }
    {
        const parser = p.seq(p.any, p.any);
        t.is(parser.tryParse('abc', 2), undefined);
    }
    {
        const parser = p.seq(p.any, 'b');
        t.is(parser.tryParse('aβc', 0), undefined);
    }
    {
        const parser = p.seq('a', p.str('b'));
        t.is(parser.tryParse('Abc', 0), undefined);
        t.is(parser.tryParse('aac', 0), undefined);
        t.is(parser.tryParse('abc', 1), undefined);
    }
    {
        const parser = p.seq('x', p.str('x').optional, p.str('y'));
        t.is(parser.tryParse('xyz', 1), undefined);
        t.is(parser.tryParse('Xyz', 0), undefined);
        t.is(parser.tryParse('x yz', 0), undefined);
        t.is(parser.tryParse('xxxyz', 0), undefined);
    }
});

test('should not match ; callback func', t => {
    {
        const parser = p.seq(() => [p.any]);
        t.is(parser.tryParse('', 0), undefined);
    }
    {
        const parser = p.seq(() => ['a']);
        t.is(parser.tryParse('abc', 1), undefined);
        t.is(parser.tryParse('abc', 2), undefined);
    }
    {
        const parser = p.seq(() => [p.any, p.any]);
        t.is(parser.tryParse('abc', 2), undefined);
    }
    {
        const parser = p.seq(() => [p.any, 'b'] as const);
        t.is(parser.tryParse('aβc', 0), undefined);
    }
    {
        const parser = p.seq(() => ['a', p.str('b')]);
        t.is(parser.tryParse('Abc', 0), undefined);
        t.is(parser.tryParse('aac', 0), undefined);
        t.is(parser.tryParse('abc', 1), undefined);
    }
    {
        const parser = p.seq(() => ['x', p.str('x').optional, p.str('y')]);
        t.is(parser.tryParse('xyz', 1), undefined);
        t.is(parser.tryParse('Xyz', 0), undefined);
        t.is(parser.tryParse('x yz', 0), undefined);
        t.is(parser.tryParse('xxxyz', 0), undefined);
    }
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
        () => p.seq(() => []).tryParse('foo', 0),
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
            () => p.seq(() => [arg]).tryParse('foo', 0),
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
                () => p.seq(() => arg).tryParse('foo', 0),
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
    }).tryParse('', 0);
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
    const seqP1Fn1 = p.seq(expsFn1);
    const seqP1Fn2 = p.seq(expsFn2);
    const seqP1Fn3 = p.seq(expsFn3);
    const seqP1Shoge = p.seq('hoge');
    const seqP2Shoge = p2.seq('hoge');

    // seqP1Sfoo
    t.is(seqP1Sfoo, p.seq(parserSfoo));
    t.is(seqP1Sfoo, p.seq(p.str('foo')));
    t.is<Parser<[string]>>(seqP1Sfoo, p.seq('foo'));
    // seqP1Sbar
    t.is(seqP1Sbar, p.seq(parserSbar));
    t.is(seqP1Sbar, p.seq(p.str('bar')));
    t.is<Parser<[string]>>(seqP1Sbar, p.seq('bar'));
    // seqP1Fn1 ~ seqP1Fn3
    t.is(seqP1Fn1, p.seq(expsFn1));
    t.is(seqP1Fn2, p.seq(expsFn2));
    t.is(seqP1Fn3, p.seq(expsFn3));
    // seqP1Shoge
    t.is(seqP1Shoge, p.seq('hoge'));
    t.is<Parser<[string]>>(seqP1Shoge, p.seq(p.str('hoge')));
    // seqP2Shoge
    t.is(seqP2Shoge, p2.seq('hoge'));

    t.not<Parser<[string]>>(seqP1Sfoo, seqP1Sbar);
    t.not<Parser<string[]>>(seqP1Fn1, seqP1Fn2);
    t.not(seqP1Fn1, seqP1Fn3);
    t.not(
        seqP1Shoge,
        seqP2Shoge,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    assertExtendType<Parser<['foo']>, typeof seqP1Sfoo>();
    assertExtendType<Parser<['bar']>, typeof seqP1Sbar>();
    assertExtendType<Parser<['x-', 'foo', '-', string]>, typeof seqP1Fn1>();
    assertExtendType<Parser<['foo', '-', 'bar']>, typeof seqP1Fn2>();
    assertExtendType<Parser<['x-', 'foo', '-', string]>, typeof seqP1Fn3>();
    assertExtendType<Parser<['hoge']>, typeof seqP1Shoge>();
    assertExtendType<Parser<['hoge']>, typeof seqP2Shoge>();
});