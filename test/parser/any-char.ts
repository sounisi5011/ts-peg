import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, {
    AnyCharacterParser,
    ParserGenerator,
    ParserResultDataType,
} from '../../src';

assertType<TypeEq<typeof p.any, AnyCharacterParser>>();
assertType<TypeEq<ParserResultDataType<typeof p.any>, string>>();

test('should match one character', t => {
    t.is(p.any.tryParse('abc', 0, Infinity)?.data, 'a');
    t.is(p.any.tryParse('abc', 1, Infinity)?.data, 'b');
    t.is(p.any.tryParse('abc', 2, Infinity)?.data, 'c');
});

test('should not match one character', t => {
    t.is(p.any.tryParse('abc', 0, 1)?.data, 'a');
    t.is(p.any.tryParse('abc', 0, 0), undefined);
});

test('should not match empty string', t => {
    t.is(p.any.tryParse('', 0, Infinity), undefined);
});

test('should not match if starting offset is out of range', t => {
    t.is(p.any.tryParse('123', 3, Infinity), undefined);
    t.is(p.any.tryParse('123', 99, Infinity), undefined);
});

test('should match one emoji (Unicode surrogate pair char)', t => {
    t.is(p.any.tryParse('🐉💭😋🏡', 0, Infinity)?.data, '\uD83D\uDC09');
    t.is(
        p.any.tryParse('🐉🗯🍽👪💦', 1, Infinity)?.data,
        '\uDC09',
        'should match low surrogate char',
    );
    t.is(p.any.tryParse('🐉💨💀💀💩', 2, Infinity)?.data, '\uD83D\uDCA8');
});

test('should not match one combining character sequence', t => {
    t.is(p.any.tryParse('🇯🇵', 0, Infinity)?.data, '\u{1F1EF}');
    t.is(p.any.tryParse('🇯🇵', 1, Infinity)?.data, '\uDDEF');
    t.is(p.any.tryParse('🇯🇵', 2, Infinity)?.data, '\u{1F1F5}');
    t.is(p.any.tryParse('🇯🇵', 3, Infinity)?.data, '\uDDF5');
    t.is(p.any.tryParse('🇯🇵', 4, Infinity), undefined);
});

test('getter property "any" should return the same object', t => {
    const p2 = new ParserGenerator();
    const any11 = p.any;
    const any12 = p.any;
    const any21 = p2.any;
    const any22 = p2.any;

    t.is(any11, any12);
    t.is(any21, any22);

    t.not(
        any11,
        any21,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    assertType<TypeEq<typeof any11, AnyCharacterParser>>();
    assertType<TypeEq<typeof any12, AnyCharacterParser>>();
    assertType<TypeEq<typeof any21, AnyCharacterParser>>();
    assertType<TypeEq<typeof any22, AnyCharacterParser>>();
});
