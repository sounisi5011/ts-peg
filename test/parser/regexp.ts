import test from 'ava';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { ParserGenerator, ParserResultDataType } from '../../src';
import { parse } from '../helpers/parser';

test('should match', t => {
    t.deepEqual(parse(p.re(/regexp?/), 'regex'), {
        data: 'regex',
        offsetEnd: 5,
    });
    t.deepEqual(parse(p.re(/regexp?/), 'regexp'), {
        data: 'regexp',
        offsetEnd: 6,
    });
    t.deepEqual(parse(p.re(/regexp?/), 'regexxxxxx'), {
        data: 'regex',
        offsetEnd: 5,
    });
    t.deepEqual(parse(p.re(/regexp?/), '- regexp is ...', 2), {
        data: 'regexp',
        offsetEnd: 8,
    });
});

test('should not match', t => {
    t.is(parse(p.re(/regexp?/), '- regex is ...', 0), undefined);
    t.is(parse(p.re(/regexp?/), '- regex is ...', 3), undefined);
    t.is(parse(p.re(/https?/), '- regex is ...'), undefined);
    t.is(parse(p.re(/regexp?/), 'regex', 0, 2), undefined);
});

test('should match empty string', t => {
    t.deepEqual(parse(p.re(new RegExp('')), ''), { data: '', offsetEnd: 0 });
    t.deepEqual(parse(p.re(/(?:)/), 'abc'), { data: '', offsetEnd: 0 });
    t.deepEqual(parse(p.re(/(?:)/), 'foo', 1), { data: '', offsetEnd: 1 });
    t.deepEqual(parse(p.re(/(?:)/), 'xyz', 3), { data: '', offsetEnd: 3 });
});

test('should fail by invalid arguments', t => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */

    t.throws(
        // @ts-ignore
        () => p.re(),
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
        () => null,
        /regex/,
        Symbol(''),
        p.any,
    ]) {
        const message = util.inspect({ arg }, { breakLength: Infinity });
        if (arg instanceof RegExp) {
            t.notThrows(() => p.re(arg), message);
        } else {
            t.throws(
                // @ts-ignore
                () => p.re(arg),
                {
                    instanceOf: TypeError,
                    message:
                        'only the RegExp object can be specified as argument',
                },
                message,
            );
        }
    }

    /* eslint-enable */
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const p2 = new ParserGenerator();

    t.is(p.re(/foo/), p.re(/foo/));
    t.is(p.re(/bar/i), p.re(/bar/i));
    t.is(p.re(/baz/m), p.re(/baz/m));
    t.is(p.re(/qux/y), p.re(/qux/));
    t.is(p.re(/quux/g), p.re(/quux/));
    t.is(p.re(/corge/g), p.re(/corge/y));
    t.is(p.re(/grault/gy), p.re(/grault/y));
    t.is(p.re(/garply/gy), p.re(/garply/g));
    t.is(p.re(/waldo/giy), p.re(/waldo/i));
    t.is(p.re(/fred/gisy), p.re(/fred/is));

    t.not(p.re(/foo/), p.re(/bar/));
    t.not(p.re(/foo/), p.re(/(?:foo)/));
    t.not(p.re(/foo/i), p.re(/foo/));
    t.not(p.re(/foo/m), p.re(/foo/));
    t.not(p.re(/foo/s), p.re(/foo/));
    t.not(p.re(/foo/u), p.re(/foo/));
    t.not(p.re(/foo/i), p.re(/foo/m));
    t.not(p.re(/foo/im), p.re(/foo/i));
    t.not(p.re(/foo/su), p.re(/foo/im));
    t.not(
        p.re(/foo/),
        p2.re(/foo/),
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
});

{
    const parser1 = p.re(/regexp?/);
    assertType<TypeEq<string, ParserResultDataType<typeof parser1>>>();
    const parser2 = p.re(/https?/i);
    assertType<TypeEq<string, ParserResultDataType<typeof parser2>>>();
    const parser3 = p.re(new RegExp(''));
    assertType<TypeEq<string, ParserResultDataType<typeof parser3>>>();
}
