import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, {
    AnyCharacterParser,
    ParserGenerator,
    ParserResultDataType,
} from '../../src';
import { parse } from '../helpers/parser';

assertType<TypeEq<typeof p.any, AnyCharacterParser>>();
assertType<TypeEq<ParserResultDataType<typeof p.any>, string>>();

test('should match one character', t => {
    t.is(parse(p.any, 'abc')?.data, 'a');
    t.is(parse(p.any, 'abc', 1)?.data, 'b');
    t.is(parse(p.any, 'abc', 2)?.data, 'c');
});

test('should not match one character', t => {
    t.is(parse(p.any, 'abc', 0, 1)?.data, 'a');
    t.is(parse(p.any, 'abc', 0, 0), undefined);
});

test('should not match empty string', t => {
    t.is(parse(p.any, ''), undefined);
});

test('should not match if starting offset is out of range', t => {
    t.is(parse(p.any, '123', 3), undefined);
    t.is(parse(p.any, '123', 99), undefined);
});

test('should match one emoji (Unicode surrogate pair char)', t => {
    t.is(parse(p.any, '🐉💭😋🏡', 0)?.data, '\uD83D\uDC09');
    t.is(
        parse(p.any, '🐉🗯🍽👪💦', 1)?.data,
        '\uDC09',
        'should match low surrogate char',
    );
    t.is(parse(p.any, '🐉💨💀💀💩', 2)?.data, '\uD83D\uDCA8');
});

test('should not match one combining character sequence', t => {
    t.is(parse(p.any, '🇯🇵', 0)?.data, '\u{1F1EF}');
    t.is(parse(p.any, '🇯🇵', 1)?.data, '\uDDEF');
    t.is(parse(p.any, '🇯🇵', 2)?.data, '\u{1F1F5}');
    t.is(parse(p.any, '🇯🇵', 3)?.data, '\uDDF5');
    t.is(parse(p.any, '🇯🇵', 4), undefined);
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
