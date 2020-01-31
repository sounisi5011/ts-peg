/*
 * Example parser matching an empty string
 */

import test from 'ava';

import p from '../src';

test('should match', t => {
    t.notThrows(() => {
        const parser = p.str('');
        t.is(parser.tryParse('', 0, Infinity)?.offsetEnd, 0);
        t.is(parser.tryParse('', 0, Infinity)?.data, '');
        t.is(parser.tryParse('abc', 1, Infinity)?.offsetEnd, 1);
        t.is(parser.tryParse('abc', 1, Infinity)?.data, '');
    });

    t.notThrows(() => {
        const parser = p.is_a(() => true);
        t.is(parser.tryParse('', 0, Infinity)?.offsetEnd, 0);
        t.is(parser.tryParse('', 0, Infinity)?.data, null);
        t.is(parser.tryParse('abc', 1, Infinity)?.offsetEnd, 1);
        t.is(parser.tryParse('abc', 1, Infinity)?.data, null);
    });

    t.notThrows(() => {
        const parser = p.not_a(() => false);
        t.is(parser.tryParse('', 0, Infinity)?.offsetEnd, 0);
        t.is(parser.tryParse('', 0, Infinity)?.data, null);
        t.is(parser.tryParse('abc', 1, Infinity)?.offsetEnd, 1);
        t.is(parser.tryParse('abc', 1, Infinity)?.data, null);
    });

    t.notThrows(() => {
        const parser = p.any.times(0);
        t.deepEqual(parser.tryParse('', 0, Infinity)?.offsetEnd, 0);
        t.deepEqual(parser.tryParse('', 0, Infinity)?.data, []);
        t.deepEqual(parser.tryParse('abc', 1, Infinity)?.offsetEnd, 1);
        t.deepEqual(parser.tryParse('abc', 1, Infinity)?.data, []);
    });

    t.notThrows(() => {
        // Note: `p.chars("")` does not match any kind of character.
        const parser = p.chars('').optional;
        t.is(parser.tryParse('', 0, Infinity)?.offsetEnd, 0);
        t.is(parser.tryParse('', 0, Infinity)?.data, undefined);
        t.is(parser.tryParse('abc', 1, Infinity)?.offsetEnd, 1);
        t.is(parser.tryParse('abc', 1, Infinity)?.data, undefined);
    });

    t.notThrows(() => {
        const parser = p.chars('').zeroOrMore;
        t.deepEqual(parser.tryParse('', 0, Infinity)?.offsetEnd, 0);
        t.deepEqual(parser.tryParse('', 0, Infinity)?.data, []);
        t.deepEqual(parser.tryParse('abc', 1, Infinity)?.offsetEnd, 1);
        t.deepEqual(parser.tryParse('abc', 1, Infinity)?.data, []);
    });
});
