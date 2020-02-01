/*
 * Example parser matching an empty string
 */

import test from 'ava';

import p from '../src';
import { parse } from './helpers/parser';

test('should match', t => {
    t.notThrows(() => {
        const parser = p.str('');
        t.is(parse(parser, '')?.offsetEnd, 0);
        t.is(parse(parser, '')?.data, '');
        t.is(parse(parser, 'abc', 1)?.offsetEnd, 1);
        t.is(parse(parser, 'abc', 1)?.data, '');
    });

    t.notThrows(() => {
        const parser = p.re(/(?:)/);
        t.is(parse(parser, '')?.offsetEnd, 0);
        t.is(parse(parser, '')?.data, '');
        t.is(parse(parser, 'abc', 1)?.offsetEnd, 1);
        t.is(parse(parser, 'abc', 1)?.data, '');
    });

    t.notThrows(() => {
        const parser = p.is_a(() => true);
        t.is(parse(parser, '')?.offsetEnd, 0);
        t.is(parse(parser, '')?.data, null);
        t.is(parse(parser, 'abc', 1)?.offsetEnd, 1);
        t.is(parse(parser, 'abc', 1)?.data, null);
    });

    t.notThrows(() => {
        const parser = p.not_a(() => false);
        t.is(parse(parser, '')?.offsetEnd, 0);
        t.is(parse(parser, '')?.data, null);
        t.is(parse(parser, 'abc', 1)?.offsetEnd, 1);
        t.is(parse(parser, 'abc', 1)?.data, null);
    });

    t.notThrows(() => {
        const parser = p.any.times(0);
        t.deepEqual(parse(parser, '')?.offsetEnd, 0);
        t.deepEqual(parse(parser, '')?.data, []);
        t.deepEqual(parse(parser, 'abc', 1)?.offsetEnd, 1);
        t.deepEqual(parse(parser, 'abc', 1)?.data, []);
    });

    t.notThrows(() => {
        // Note: `p.chars("")` does not match any kind of character.
        const parser = p.chars('').optional;
        t.is(parse(parser, '')?.offsetEnd, 0);
        t.is(parse(parser, '')?.data, undefined);
        t.is(parse(parser, 'abc', 1)?.offsetEnd, 1);
        t.is(parse(parser, 'abc', 1)?.data, undefined);
    });

    t.notThrows(() => {
        const parser = p.chars('').zeroOrMore;
        t.deepEqual(parse(parser, '')?.offsetEnd, 0);
        t.deepEqual(parse(parser, '')?.data, []);
        t.deepEqual(parse(parser, 'abc', 1)?.offsetEnd, 1);
        t.deepEqual(parse(parser, 'abc', 1)?.data, []);
    });
});
