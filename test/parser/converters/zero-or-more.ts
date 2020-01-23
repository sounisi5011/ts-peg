import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator } from '../../../src';

test('should match', t => {
    t.deepEqual(p.any.zeroOrMore.tryParse('abc', 0)?.data, ['a', 'b', 'c']);
    t.deepEqual(p.any.zeroOrMore.tryParse('', 0)?.data, []);
    t.deepEqual(p.str('x').zeroOrMore.tryParse('xxyyzz', 0)?.data, ['x', 'x']);
    t.deepEqual(p.str('x').zeroOrMore.tryParse('xxyyzz', 1)?.data, ['x']);
});

test('should not match if starting offset is out of range', t => {
    t.is(p.any.zeroOrMore.tryParse('abc', 99), undefined);
});

test('getter property "zeroOrMore" should return the same Parser object', t => {
    const parser1α = p.str('α');
    const parser1β = p.str('β');
    const parser2α = new ParserGenerator().str('α');
    const zom1α1 = parser1α.zeroOrMore;
    const zom1α2 = parser1α.zeroOrMore;
    const zom1β1 = parser1β.zeroOrMore;
    const zom1β2 = parser1β.zeroOrMore;
    const zom2α1 = parser2α.zeroOrMore;
    const zom2α2 = parser2α.zeroOrMore;

    t.is(zom1α1, zom1α2);
    t.is(zom1β1, zom1β2);
    t.is(zom2α1, zom2α2);

    t.not<Parser<string[]>>(zom1α1, zom1β1);
    t.not(
        zom1α1,
        zom2α1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not<Parser<string[]>>(zom1β1, zom2α1);

    assertType<TypeEq<typeof zom1α1, Parser<[...'α'[]]>>>();
    assertType<TypeEq<typeof zom1α2, Parser<[...'α'[]]>>>();
    assertType<TypeEq<typeof zom1β1, Parser<[...'β'[]]>>>();
    assertType<TypeEq<typeof zom1β2, Parser<[...'β'[]]>>>();
    assertType<TypeEq<typeof zom2α1, Parser<[...'α'[]]>>>();
    assertType<TypeEq<typeof zom2α2, Parser<[...'α'[]]>>>();
});
