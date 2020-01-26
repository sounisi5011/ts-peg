import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../../src';

test('should match', t => {
    t.deepEqual(p.any.oneOrMore.tryParse('abc', 0)?.data, ['a', 'b', 'c']);
    t.deepEqual(p.str('x').oneOrMore.tryParse('xxyyzz', 0)?.data, ['x', 'x']);
    t.deepEqual(p.str('x').oneOrMore.tryParse('xxyyzz', 1)?.data, ['x']);
});

test('should not match', t => {
    t.is(p.any.oneOrMore.tryParse('', 0), undefined);
    t.is(p.str('x').oneOrMore.tryParse('abc', 0), undefined);
    t.is(p.any.oneOrMore.tryParse('abc', 99), undefined);
});

test('getter property "oneOrMore" should return the same Parser object', t => {
    const parser1α = p.str('α');
    const parser1β = p.str('β');
    const parser2α = new ParserGenerator().str('α');
    const oom1α1 = parser1α.oneOrMore;
    const oom1α2 = parser1α.oneOrMore;
    const oom1β1 = parser1β.oneOrMore;
    const oom1β2 = parser1β.oneOrMore;
    const oom2α1 = parser2α.oneOrMore;
    const oom2α2 = parser2α.oneOrMore;

    t.is(oom1α1, oom1α2);
    t.is(oom1β1, oom1β2);
    t.is(oom2α1, oom2α2);

    t.not<Parser<string[]>>(oom1α1, oom1β1);
    t.not(
        oom1α1,
        oom2α1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not<Parser<string[]>>(oom1β1, oom2α1);

    assertType<TypeEq<['α', ...'α'[]], ParserResultDataType<typeof oom1α1>>>();
    assertType<TypeEq<['α', ...'α'[]], ParserResultDataType<typeof oom1α2>>>();
    assertType<TypeEq<['β', ...'β'[]], ParserResultDataType<typeof oom1β1>>>();
    assertType<TypeEq<['β', ...'β'[]], ParserResultDataType<typeof oom1β2>>>();
    assertType<TypeEq<['α', ...'α'[]], ParserResultDataType<typeof oom2α1>>>();
    assertType<TypeEq<['α', ...'α'[]], ParserResultDataType<typeof oom2α2>>>();
});
