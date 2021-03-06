import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../src';
import { parse } from '../helpers/parser';

test('should match', t => {
    {
        const parser = p.is_a(p.any);
        t.deepEqual(parse(parser, 'abc'), {
            data: null,
            offsetEnd: 0,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(() => p.any);
        t.deepEqual(parse(parser, 'abc'), {
            data: null,
            offsetEnd: 0,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(p.any);
        t.deepEqual(parse(parser, 'abc', 1), {
            data: null,
            offsetEnd: 1,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(() => p.any);
        t.deepEqual(parse(parser, 'abc', 1), {
            data: null,
            offsetEnd: 1,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a('a');
        t.deepEqual(parse(parser, 'abc'), {
            data: null,
            offsetEnd: 0,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(p.str('a'));
        t.deepEqual(parse(parser, 'abc'), {
            data: null,
            offsetEnd: 0,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(() => p.str('a'));
        t.deepEqual(parse(parser, 'abc'), {
            data: null,
            offsetEnd: 0,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a('bc');
        t.deepEqual(parse(parser, 'abc', 1), {
            data: null,
            offsetEnd: 1,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(p.str('bc'));
        t.deepEqual(parse(parser, 'abc', 1), {
            data: null,
            offsetEnd: 1,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(() => p.str('bc'));
        t.deepEqual(parse(parser, 'abc', 1), {
            data: null,
            offsetEnd: 1,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(() => true);
        t.deepEqual(parse(parser, 'abc'), {
            data: null,
            offsetEnd: 0,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(env => env.offset < env.input.length);
        t.deepEqual(parse(parser, 'abc'), {
            data: null,
            offsetEnd: 0,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
    {
        const parser = p.is_a(env => env.offset < env.input.length);
        t.deepEqual(parse(parser, 'abc', 1), {
            data: null,
            offsetEnd: 1,
        });
        assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
    }
});

test('should not match', t => {
    {
        const parser = p.is_a(p.any);
        t.is(parse(parser, 'abc', 3), undefined);
        t.is(parse(parser, 'abc', 0, 0), undefined);
    }
    {
        const parser = p.is_a(() => p.any);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(p.any);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(() => p.any);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a('a');
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(p.str('a'));
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(() => p.str('a'));
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a('bc');
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(p.str('bc'));
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(() => p.str('bc'));
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(() => false);
        t.is(parse(parser, 'abc'), undefined);
        t.is(parse(parser, 'abc', 1), undefined);
        t.is(parse(parser, 'abc', 2), undefined);
        t.is(parse(parser, 'abc', 3), undefined);
    }
    {
        const parser = p.is_a(env => env.offset < env.input.length);
        t.is(parse(parser, 'abc', 3), undefined);
    }
});

test('should fail by invalid arguments', t => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */

    t.throws(
        // @ts-ignore
        () => p.is_a(),
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
            arg instanceof RegExp ||
            arg instanceof Parser
        ) {
            // @ts-ignore
            t.notThrows(() => p.is_a(arg), message);
        } else {
            t.throws(
                // @ts-ignore
                () => p.is_a(arg),
                {
                    instanceOf: TypeError,
                    message:
                        'only the Parser object, string, RegExp or function can be specified as argument',
                },
                message,
            );
        }
        if (typeof arg === 'boolean' || arg instanceof Parser) {
            t.notThrows(
                // @ts-ignore
                () => p.is_a(() => arg).tryParse('foo', 0, Infinity),
                message,
            );
        } else {
            t.throws(
                // @ts-ignore
                () => p.is_a(() => arg).tryParse('foo', 0, Infinity),
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

    p.is_a(() => {
        t.fail();
        return p.any;
    });

    p.is_a(() => {
        t.pass();
        return p.any;
    }).tryParse('', 0, Infinity);
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const parserSfoo = p.str('foo');
    const parserSbar = p.str('bar');
    const expsFn1 = (): typeof parserSfoo => parserSfoo;
    const expsFn2 = () => true as const;
    const expsFn3 = (): typeof parserSfoo => parserSfoo;

    const p2 = new ParserGenerator();
    const lookaheadP1Sfoo = p.is_a(parserSfoo);
    const lookaheadP1Sbar = p.is_a(parserSbar);
    const lookaheadP1Fn1 = p.is_a(expsFn1);
    const lookaheadP1Fn2 = p.is_a(expsFn2);
    const lookaheadP1Fn3 = p.is_a(expsFn3);
    const lookaheadP1Shoge = p.is_a('hoge');
    const lookaheadP2Shoge = p2.is_a('hoge');

    const negativeLookaheadP1Sfoo = p.not_a(parserSfoo);
    const negativeLookaheadP1Sbar = p.not_a(parserSbar);
    const negativeLookaheadP1Fn1 = p.not_a(expsFn1);
    const negativeLookaheadP1Fn2 = p.not_a(expsFn2);
    const negativeLookaheadP1Fn3 = p.not_a(expsFn3);
    const negativeLookaheadP1Shoge = p.not_a('hoge');
    const negativeLookaheadP2Shoge = p2.not_a('hoge');

    // lookaheadP1Sfoo
    t.is(lookaheadP1Sfoo, p.is_a(parserSfoo));
    t.is(lookaheadP1Sfoo, p.is_a(p.str('foo')));
    t.is(lookaheadP1Sfoo, p.is_a('foo'));
    // lookaheadP1Sbar
    t.is(lookaheadP1Sbar, p.is_a(parserSbar));
    t.is(lookaheadP1Sbar, p.is_a(p.str('bar')));
    t.is(lookaheadP1Sbar, p.is_a('bar'));
    // lookaheadP1Fn1 ~ lookaheadP1Fn3
    t.is(lookaheadP1Fn1, p.is_a(expsFn1));
    t.is(lookaheadP1Fn2, p.is_a(expsFn2));
    t.is(lookaheadP1Fn3, p.is_a(expsFn3));
    // lookaheadP1Shoge
    t.is(lookaheadP1Shoge, p.is_a('hoge'));
    t.is(lookaheadP1Shoge, p.is_a(p.str('hoge')));
    // lookaheadP2Shoge
    t.is(lookaheadP2Shoge, p2.is_a('hoge'));

    // negativeLookaheadP1Sfoo
    t.is(negativeLookaheadP1Sfoo, p.not_a(parserSfoo));
    t.is(negativeLookaheadP1Sfoo, p.not_a(p.str('foo')));
    t.is(negativeLookaheadP1Sfoo, p.not_a('foo'));
    // negativeLookaheadP1Sbar
    t.is(negativeLookaheadP1Sbar, p.not_a(parserSbar));
    t.is(negativeLookaheadP1Sbar, p.not_a(p.str('bar')));
    t.is(negativeLookaheadP1Sbar, p.not_a('bar'));
    // negativeLookaheadP1Fn1 ~ negativeLookaheadP1Fn3
    t.is(negativeLookaheadP1Fn1, p.not_a(expsFn1));
    t.is(negativeLookaheadP1Fn2, p.not_a(expsFn2));
    t.is(negativeLookaheadP1Fn3, p.not_a(expsFn3));
    // negativeLookaheadP1Shoge
    t.is(negativeLookaheadP1Shoge, p.not_a('hoge'));
    t.is(negativeLookaheadP1Shoge, p.not_a(p.str('hoge')));
    // negativeLookaheadP2Shoge
    t.is(negativeLookaheadP2Shoge, p2.not_a('hoge'));

    t.not(lookaheadP1Sfoo, lookaheadP1Sbar);
    t.not(lookaheadP1Fn1, lookaheadP1Fn2);
    t.not(lookaheadP1Fn1, lookaheadP1Fn3);
    t.not(
        lookaheadP1Shoge,
        lookaheadP2Shoge,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    t.not(negativeLookaheadP1Sfoo, negativeLookaheadP1Sbar);
    t.not(negativeLookaheadP1Fn1, negativeLookaheadP1Fn2);
    t.not(negativeLookaheadP1Fn1, negativeLookaheadP1Fn3);
    t.not(
        negativeLookaheadP1Shoge,
        negativeLookaheadP2Shoge,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    t.not(lookaheadP1Sfoo, negativeLookaheadP1Sfoo);
    t.not(lookaheadP1Sbar, negativeLookaheadP1Sbar);
    t.not(lookaheadP1Fn1, negativeLookaheadP1Fn1);
    t.not(lookaheadP1Fn2, negativeLookaheadP1Fn2);
    t.not(lookaheadP1Fn3, negativeLookaheadP1Fn3);
    t.not(lookaheadP1Shoge, negativeLookaheadP1Shoge);
    t.not(lookaheadP2Shoge, negativeLookaheadP2Shoge);

    assertType<TypeEq<null, ParserResultDataType<typeof lookaheadP1Sfoo>>>();
    assertType<TypeEq<null, ParserResultDataType<typeof lookaheadP1Sbar>>>();
    assertType<TypeEq<null, ParserResultDataType<typeof lookaheadP1Fn1>>>();
    assertType<TypeEq<null, ParserResultDataType<typeof lookaheadP1Fn2>>>();
    assertType<TypeEq<null, ParserResultDataType<typeof lookaheadP1Fn3>>>();
    assertType<TypeEq<null, ParserResultDataType<typeof lookaheadP1Shoge>>>();
    assertType<TypeEq<null, ParserResultDataType<typeof lookaheadP2Shoge>>>();
    assertType<
        TypeEq<null, ParserResultDataType<typeof negativeLookaheadP1Sfoo>>
    >();
    assertType<
        TypeEq<null, ParserResultDataType<typeof negativeLookaheadP1Sbar>>
    >();
    assertType<
        TypeEq<null, ParserResultDataType<typeof negativeLookaheadP1Fn1>>
    >();
    assertType<
        TypeEq<null, ParserResultDataType<typeof negativeLookaheadP1Fn2>>
    >();
    assertType<
        TypeEq<null, ParserResultDataType<typeof negativeLookaheadP1Fn3>>
    >();
    assertType<
        TypeEq<null, ParserResultDataType<typeof negativeLookaheadP1Shoge>>
    >();
    assertType<
        TypeEq<null, ParserResultDataType<typeof negativeLookaheadP2Shoge>>
    >();
});
