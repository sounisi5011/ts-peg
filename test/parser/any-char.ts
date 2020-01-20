import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, {
    AnyCharacterParser,
    Parser,
    ParserGenerator,
    ParserResult,
} from '../../src';

assertType<TypeEq<typeof p.any, AnyCharacterParser>>();
assertType<TypeEq<typeof p.any, Parser<string>>>();
assertType<TypeEq<ParserResult<typeof p.any>, string>>();

test('should match one character', t => {
    t.deepEqual(p.any.tryParse('abc', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(p.any.tryParse('abc', 1), {
        offsetEnd: 2,
        data: 'b',
    });
    t.deepEqual(p.any.tryParse('abc', 2), {
        offsetEnd: 3,
        data: 'c',
    });
});

test('should not match empty string', t => {
    t.is(p.any.tryParse('', 0), undefined);
});

test('should not match if starting offset is out of range', t => {
    t.is(p.any.tryParse('123', 3), undefined);
    t.is(p.any.tryParse('123', 99), undefined);
});

test('should match one emoji (Unicode surrogate pair char)', t => {
    t.deepEqual(p.any.tryParse('🐉💭😋🏡', 0), {
        offsetEnd: 2,
        data: '\uD83D\uDC09',
    });
    t.deepEqual(
        p.any.tryParse('🐉🗯🍽👪💦', 1),
        {
            offsetEnd: 2,
            data: '\uDC09',
        },
        'should match low surrogate char',
    );
    t.deepEqual(p.any.tryParse('🐉💨💀💀💩', 2), {
        offsetEnd: 4,
        data: '\uD83D\uDCA8',
    });
});

test('should not match one combining character sequence', t => {
    t.deepEqual(p.any.tryParse('🇯🇵', 0), {
        offsetEnd: 2,
        data: '\u{1F1EF}',
    });
    t.deepEqual(p.any.tryParse('🇯🇵', 1), {
        offsetEnd: 2,
        data: '\uDDEF',
    });
    t.deepEqual(p.any.tryParse('🇯🇵', 2), {
        offsetEnd: 4,
        data: '\u{1F1F5}',
    });
    t.deepEqual(p.any.tryParse('🇯🇵', 3), {
        offsetEnd: 4,
        data: '\uDDF5',
    });
    t.is(p.any.tryParse('🇯🇵', 4), undefined);
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

    assertType<TypeEq<typeof any11, Parser<string>>>();
    assertType<TypeEq<typeof any11, AnyCharacterParser>>();
    assertType<TypeEq<typeof any12, Parser<string>>>();
    assertType<TypeEq<typeof any12, AnyCharacterParser>>();
    assertType<TypeEq<typeof any21, Parser<string>>>();
    assertType<TypeEq<typeof any21, AnyCharacterParser>>();
    assertType<TypeEq<typeof any22, Parser<string>>>();
    assertType<TypeEq<typeof any22, AnyCharacterParser>>();
});
