import test from 'ava';
import * as iterTools from 'iter-tools';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, {
    CharacterClassParser,
    ParserGenerator,
    ParserResult,
} from '../../src';
import { OneOrMoreArray } from '../helpers/type';

assertType<TypeEq<ParserResult<CharacterClassParser>, string>>();

test('should match characters: "abc123"', t => {
    const parser = p.chars('abc123');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('a', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(parser.tryParse('bca', 0), {
        offsetEnd: 1,
        data: 'b',
    });
    t.deepEqual(parser.tryParse('123', 0), {
        offsetEnd: 1,
        data: '1',
    });
    t.deepEqual(parser.tryParse('345', 0), {
        offsetEnd: 1,
        data: '3',
    });

    t.is(parser.tryParse('hax', 0), undefined);
    t.is(parser.tryParse('813', 0), undefined);
});

test('should match inverted characters: "^abc123"', t => {
    const parser = p.chars('^abc123');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('h', 0), {
        offsetEnd: 1,
        data: 'h',
    });
    t.deepEqual(parser.tryParse('893', 0), {
        offsetEnd: 1,
        data: '8',
    });
    t.deepEqual(parser.tryParse('HAL 9000', 0), {
        offsetEnd: 1,
        data: 'H',
    });
    t.deepEqual(parser.tryParse('0123', 0), {
        offsetEnd: 1,
        data: '0',
    });

    t.is(parser.tryParse('1', 0), undefined);
    t.is(parser.tryParse('2', 0), undefined);
    t.is(parser.tryParse('3', 0), undefined);
    t.is(parser.tryParse('a', 0), undefined);
    t.is(parser.tryParse('b', 0), undefined);
    t.is(parser.tryParse('c', 0), undefined);
});

test('should match character range: "a-f"', t => {
    const parser = p.chars('a-f');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('a', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(parser.tryParse('baka', 0), {
        offsetEnd: 1,
        data: 'b',
    });
    t.deepEqual(parser.tryParse('fuse', 0), {
        offsetEnd: 1,
        data: 'f',
    });

    t.is(parser.tryParse('2', 0), undefined);
    t.is(parser.tryParse('x', 0), undefined);
    t.is(parser.tryParse('-', 0), undefined);
});

test('should match character range: "f-a"', t => {
    const parser = p.chars('f-a');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('f', 0), {
        offsetEnd: 1,
        data: 'f',
    });
    t.deepEqual(parser.tryParse('affine', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(parser.tryParse('custard', 0), {
        offsetEnd: 1,
        data: 'c',
    });

    t.is(parser.tryParse('2', 0), undefined);
    t.is(parser.tryParse('x', 0), undefined);
    t.is(parser.tryParse('-', 0), undefined);
});

test('should match characters and character range: "0-9abc"', t => {
    const parser = p.chars('0-9abc');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('0', 0), {
        offsetEnd: 1,
        data: '0',
    });
    t.deepEqual(parser.tryParse('42', 0), {
        offsetEnd: 1,
        data: '4',
    });
    t.deepEqual(parser.tryParse('987', 0), {
        offsetEnd: 1,
        data: '9',
    });
    t.deepEqual(parser.tryParse('abc', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(parser.tryParse('bamboo', 0), {
        offsetEnd: 1,
        data: 'b',
    });
    t.deepEqual(parser.tryParse('cute', 0), {
        offsetEnd: 1,
        data: 'c',
    });

    t.is(parser.tryParse('x', 0), undefined);
    t.is(parser.tryParse('A', 0), undefined);
    t.is(parser.tryParse('-', 0), undefined);
});

test('should match inverted character range: "^a-f"', t => {
    const parser = p.chars('^a-f');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('2', 0), {
        offsetEnd: 1,
        data: '2',
    });
    t.deepEqual(parser.tryParse('APL', 0), {
        offsetEnd: 1,
        data: 'A',
    });
    t.deepEqual(parser.tryParse('Halo', 0), {
        offsetEnd: 1,
        data: 'H',
    });
    t.deepEqual(parser.tryParse('--', 0), {
        offsetEnd: 1,
        data: '-',
    });

    t.is(parser.tryParse('a', 0), undefined);
    t.is(parser.tryParse('fantastic', 0), undefined);
});

test('should match characters and "-": "abc-"', t => {
    const parser = p.chars('abc-');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('a', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(parser.tryParse('bca', 0), {
        offsetEnd: 1,
        data: 'b',
    });
    t.deepEqual(parser.tryParse('-c', 0), {
        offsetEnd: 1,
        data: '-',
    });
    t.deepEqual(parser.tryParse('-x', 0), {
        offsetEnd: 1,
        data: '-',
    });

    t.is(parser.tryParse('hax', 0), undefined);
    t.is(parser.tryParse('813', 0), undefined);
    t.is(parser.tryParse('😊', 0), undefined);
});

test('should match character range and "-": "-0-9"', t => {
    const parser = p.chars('-0-9');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('0', 0), {
        offsetEnd: 1,
        data: '0',
    });
    t.deepEqual(parser.tryParse('456', 0), {
        offsetEnd: 1,
        data: '4',
    });
    t.deepEqual(parser.tryParse('9ab', 0), {
        offsetEnd: 1,
        data: '9',
    });
    t.deepEqual(parser.tryParse('-42', 0), {
        offsetEnd: 1,
        data: '-',
    });
    t.deepEqual(parser.tryParse('-x', 0), {
        offsetEnd: 1,
        data: '-',
    });

    t.is(parser.tryParse('hax', 0), undefined);
    t.is(parser.tryParse('APL', 0), undefined);
    t.is(parser.tryParse('😊', 0), undefined);
});

test('should match emoji (Unicode surrogate pair char) range', t => {
    const parser = p.chars('\uD83C\uDF47-\uD83C\uDF53'); // U+1F347 - U+1F353
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('\u{1F347}', 0), {
        offsetEnd: 2,
        data: '🍇',
    });
    t.deepEqual(parser.tryParse('\u{1F348}\u{1F34C}', 0), {
        offsetEnd: 2,
        data: '🍈',
    });
    t.deepEqual(parser.tryParse('\u{1F348}\u{1F34C}', 2), {
        offsetEnd: 4,
        data: '🍌',
    });
    t.deepEqual(parser.tryParse('\u{1F353}', 0), {
        offsetEnd: 2,
        data: '🍓',
    });

    t.is(parser.tryParse('x', 0), undefined);
    t.is(parser.tryParse('\u{1F965}', 0), undefined);
    t.is(
        parser.tryParse('\uDF47', 0),
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parser.tryParse('\uD900', 0),
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parser.tryParse('\uD83C', 0),
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parser.tryParse('\u{1F348}\u{1F34C}', 1),
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parser.tryParse('\u{1F348}\u{1F34C}', 3),
        undefined,
        'should not match surrogate char',
    );
});

test('should match inverted emoji (Unicode surrogate pair char) range', t => {
    const parser = p.chars('^\uD83C\uDF47-\uD83C\uDF53'); // ! U+1F347 - U+1F353
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('x', 0), {
        offsetEnd: 1,
        data: 'x',
    });
    t.deepEqual(parser.tryParse('\u{1F4A9}', 0), {
        offsetEnd: 2,
        data: '💩',
    });
    t.deepEqual(
        parser.tryParse('\uD83C', 0),
        {
            offsetEnd: 1,
            data: '\uD83C',
        },
        'should match surrogate char',
    );
    t.deepEqual(
        parser.tryParse('\uDF47', 0),
        {
            offsetEnd: 1,
            data: '\uDF47',
        },
        'should match surrogate char',
    );
    t.deepEqual(
        parser.tryParse('\uDF53', 0),
        {
            offsetEnd: 1,
            data: '\uDF53',
        },
        'should match surrogate char',
    );
    t.deepEqual(
        parser.tryParse('\u{1F348}\u{1F34C}', 1),
        {
            offsetEnd: 2,
            data: '\uDF48',
        },
        'should match surrogate char',
    );
    t.deepEqual(
        parser.tryParse('\u{1F348}\u{1F34C}', 3),
        {
            offsetEnd: 4,
            data: '\uDF4C',
        },
        'should match surrogate char',
    );

    t.is(
        parser.tryParse('\u{1F347}', 0),
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parser.tryParse('\u{1F348}', 0),
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parser.tryParse('\u{1F34C}', 0),
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parser.tryParse('\u{1F353}', 0),
        undefined,
        'should not match emojis in inverted range',
    );
});

test('should match Unicode surrogate char range', t => {
    const parser = p.chars('\uDC00-\uDFFF\uD800-\uDBFF');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('\uD800', 0), {
        offsetEnd: 1,
        data: '\uD800',
    });
    t.deepEqual(parser.tryParse('\uD83Cx', 0), {
        offsetEnd: 1,
        data: '\uD83C',
    });
    t.deepEqual(parser.tryParse('\uDBFF', 0), {
        offsetEnd: 1,
        data: '\uDBFF',
    });
    t.deepEqual(parser.tryParse('\uDC00', 0), {
        offsetEnd: 1,
        data: '\uDC00',
    });
    t.deepEqual(parser.tryParse('\uDFFF', 0), {
        offsetEnd: 1,
        data: '\uDFFF',
    });
    t.deepEqual(
        parser.tryParse('\uD83C\uDF47', 0),
        {
            offsetEnd: 1,
            data: '\uD83C',
        },
        `should match emoji's high surrogate char`,
    );
    t.deepEqual(
        parser.tryParse('\uD83C\uDF47', 1),
        {
            offsetEnd: 2,
            data: '\uDF47',
        },
        `should match emoji's low surrogate char`,
    );

    t.is(parser.tryParse('x', 0), undefined);
});

test('should match inverted Unicode surrogate char range', t => {
    const parser = p.chars('^\uD800-\uDFFF');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('x', 0), {
        offsetEnd: 1,
        data: 'x',
    });
    t.deepEqual(
        parser.tryParse('\uD83C\uDF47', 0),
        {
            offsetEnd: 2,
            data: '\uD83C\uDF47',
        },
        `should match emoji char`,
    );

    t.is(parser.tryParse('\uD800', 0), undefined);
    t.is(parser.tryParse('\uD83Cx', 0), undefined);
    t.is(parser.tryParse('\uDBFF', 0), undefined);
    t.is(parser.tryParse('\uDC00', 0), undefined);
    t.is(parser.tryParse('\uDFFF', 0), undefined);
    t.is(parser.tryParse('\uD83C\uD83C\uDF47', 0), undefined);
});

test('should match emoji and Unicode surrogate char range', t => {
    const parser = p.chars('\uD800-\uDFFF\uD83C\uDF47-\uD83C\uDF53'); // U+D800 - U+DFFF and U+1F347 - U+1F353
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('\uD800', 0), {
        offsetEnd: 1,
        data: '\uD800',
    });
    t.deepEqual(parser.tryParse('\uDBFF', 0), {
        offsetEnd: 1,
        data: '\uDBFF',
    });
    t.deepEqual(parser.tryParse('\uDC00', 0), {
        offsetEnd: 1,
        data: '\uDC00',
    });
    t.deepEqual(parser.tryParse('\uDFFF', 0), {
        offsetEnd: 1,
        data: '\uDFFF',
    });
    t.deepEqual(
        parser.tryParse('\u{1F347}', 0),
        {
            offsetEnd: 2,
            data: '\u{1F347}',
        },
        `should match emojis in range`,
    );
    t.deepEqual(
        parser.tryParse('\u{1F353}', 0),
        {
            offsetEnd: 2,
            data: '\u{1F353}',
        },
        `should match emojis in range`,
    );
    t.deepEqual(
        parser.tryParse('\u{1F4A9}', 0), // U+1F4A9 = U+D83D U+DCA9
        {
            offsetEnd: 1,
            data: '\uD83D',
        },
        `should match out-of-range emojis high surrogate char`,
    );

    t.is(parser.tryParse('x', 0), undefined);
});

test('should not match empty string', t => {
    t.is(p.chars('abc123').tryParse('', 0), undefined);
});

test('should not match "^"', t => {
    const parser = p.chars('^^');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.is(parser.tryParse('^', 0), undefined);
    t.deepEqual(parser.tryParse('abc', 0), {
        offsetEnd: 1,
        data: 'a',
    });
});

test('should not match "-"', t => {
    const parser = p.chars('^-a');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.is(parser.tryParse('-', 0), undefined);
    t.is(parser.tryParse('a', 0), undefined);
    t.deepEqual(parser.tryParse('^', 0), {
        offsetEnd: 1,
        data: '^',
    });
});

test('should always match', t => {
    const parser = p.chars('^');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('a', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(parser.tryParse('123', 0), {
        offsetEnd: 1,
        data: '1',
    });
    t.deepEqual(parser.tryParse('^', 0), {
        offsetEnd: 1,
        data: '^',
    });
    t.deepEqual(parser.tryParse('-', 0), {
        offsetEnd: 1,
        data: '-',
    });
    t.deepEqual(parser.tryParse('\0', 0), {
        offsetEnd: 1,
        data: '\0',
    });

    t.is(parser.tryParse('', 0), undefined);
});

test('should not always match', t => {
    const parser = p.chars('');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.is(parser.tryParse('', 0), undefined);
    t.is(parser.tryParse('a', 0), undefined);
    t.is(parser.tryParse('123', 0), undefined);
    t.is(parser.tryParse('^', 0), undefined);
    t.is(parser.tryParse('-', 0), undefined);
    t.is(parser.tryParse('\0', 0), undefined);
});

test(String.raw`"\" is not an escape character`, t => {
    const parser = p.chars(String.raw`\-a`);
    assertType<TypeEq<typeof parser, CharacterClassParser>>();

    t.deepEqual(parser.tryParse('\\', 0), {
        offsetEnd: 1,
        data: '\\',
    });
    t.deepEqual(parser.tryParse('a', 0), {
        offsetEnd: 1,
        data: 'a',
    });

    t.is(
        parser.tryParse('-', 0),
        undefined,
        String.raw`"-" outside range of "\" to "a" should not match`,
    );
});

function patternCombinations(...patterns: OneOrMoreArray<string>): string[] {
    return [
        ...new Set(
            iterTools.flatMap(
                patternList =>
                    iterTools.map(
                        p => p.join(''),
                        iterTools.product(
                            ...patternList.map(pattern => [
                                pattern,
                                [...pattern].reverse().join(''),
                            ]),
                        ),
                    ),
                iterTools.permutations(patterns),
            ),
        ),
    ];
}

function patternTest(
    patternsDef: Record<
        string,
        string | OneOrMoreArray<string | OneOrMoreArray<string>>
    >,
    implementation: (arg: {
        pattern: string;
        expectedPattern: string;
        message: string;
    }) => void,
    patternsListConverter: (patternsList: string[]) => string[] = list => list,
): void {
    for (const [expectedPattern, patternsList] of Object.entries(patternsDef)) {
        for (const patterns of typeof patternsList === 'string'
            ? [patternsList]
            : patternsList) {
            for (const pattern of patternsListConverter(
                typeof patterns === 'string'
                    ? patternCombinations(patterns)
                    : patternCombinations(...patterns),
            )) {
                implementation({
                    pattern,
                    expectedPattern,
                    message: util.inspect(
                        { pattern, expectedPattern },
                        { breakLength: Infinity },
                    ),
                });
            }
        }
    }
}

test('validate "pattern" property value', t => {
    const p2 = new ParserGenerator();

    patternTest(
        {
            a: 'a',
            '-': '-',
            'a-z': 'a-z',
            '0-9a-f': [['0-9', 'a-f']],
            'a-k': [['a-g', 'c-i', 'e-k']],
            '0-9A-Z_a-z-': [['0-9', 'a-z', 'A-Z', '_', '-']],
            '--9': '--9',
            '*-9': ['*-9', ['-', '*-9']],
            '!-*0-9-': [['!-*', '0-9', '-']],
            '12': [['1', '2'], '1-2'],
            '1-3': [['1', '2', '3'], ['12', '23'], '1-3'],
            '1-3a-d': [
                ['abcd', '123'],
                ['ab', 'cd', '123'],
                ['a-d', '123'],
                ['abcd', '1-3'],
                ['a-d', '1-3'],
            ],
        },
        ({ pattern, expectedPattern, message }) => {
            const parser = p.chars(pattern);
            t.is(parser.pattern, expectedPattern, message);
            t.is(p2.chars(parser.pattern).pattern, expectedPattern, message);
        },
    );

    patternTest(
        {
            '^a': 'a',
            '^-': '-',
            '^a-z': 'a-z',
            '^0-9a-f': [['0-9', 'a-f']],
            '^a-k': [['a-g', 'c-i', 'e-k']],
            '^0-9A-Z_a-z-': [['0-9', 'a-z', 'A-Z', '_', '-']],
            '^--9': '--9',
            '^*-9': ['*-9', ['-', '*-9']],
            '^!-*0-9-': [['!-*', '0-9', '-']],
            '^12': [['1', '2'], '1-2'],
            '^1-3': [['1', '2', '3'], ['12', '23'], '1-3'],
            '^1-3a-d': [
                ['abcd', '123'],
                ['ab', 'cd', '123'],
                ['a-d', '123'],
                ['abcd', '1-3'],
                ['a-d', '1-3'],
            ],
        },
        ({ pattern, expectedPattern, message }) => {
            const parser = p.chars(pattern);
            t.is(parser.pattern, expectedPattern, message);
            t.is(p2.chars(parser.pattern).pattern, expectedPattern, message);
        },
        patternsList => patternsList.map(pattern => `^${pattern}`),
    );
});

test('validate "pattern" property value: "^" should not be a pattern prefix', t => {
    const p2 = new ParserGenerator();

    patternTest(
        {
            ']^': [[']', '^'], [']-^']],
            ']-_': [[']', '^', '_'], [']-_']],
            '_^': [['^', '_'], ['^-_']],
            '_^`': [['^', '_', '`'], ['^-`']],
            '_-a^': [['^', '_', '`', 'a'], ['^-a']],
            '_-f^': [['^-a', 'a-f'], ['^-f']],
            'a-f^': [['^', 'a-f']],
            'a-f^o-v': [['^', 'a-f', 'o-v']],
            '0^': [['0', '^']],
            '0^_': [
                ['0', '^', '_'],
                ['0', '^-_'],
            ],
            '0^-`': [
                ['0', '^', '_', '`'],
                ['0', '^-`'],
            ],
            '0^-a': [
                ['0', '^', '_', '`', 'a'],
                ['0', '^-a'],
            ],
            '0^-f': [
                ['0', '^-a', 'a-f'],
                ['0', '^-f'],
            ],
            '0^a-f': [['0', '^', 'a-f']],
            '0^a-fo-v': [['0', '^', 'a-f', 'o-v']],
            '0-9^-f': [['0-9', '^-f']],
            '0-9A-Z^': [['0-9', 'A-Z', '^']],
            '0-9A-Z^-z': [['0-9', 'A-Z', '^-f']],
        },
        ({ pattern, expectedPattern, message }) => {
            const parser = p.chars(pattern);
            t.is(parser.pattern, expectedPattern, message);
            t.is(p2.chars(parser.pattern).pattern, expectedPattern, message);
        },
        patternsList => patternsList.filter(pattern => !/^\^/.test(pattern)),
    );

    patternTest(
        {
            '^]^': [[']', '^'], [']-^']],
            '^]-_': [[']', '^', '_'], [']-_']],
            '^^_': [['^', '_'], ['^-_']],
            '^^-`': [['^', '_', '`'], ['^-`']],
            '^^-a': [['^', '_', '`', 'a'], ['^-a']],
            '^^-f': [['^-a', 'a-f'], ['^-f']],
            '^^a-f': [['^', 'a-f']],
            '^^a-fo-v': [['^', 'a-f', 'o-v']],
            '^0^': [['0', '^']],
            '^0^_': [
                ['0', '^', '_'],
                ['0', '^-_'],
            ],
            '^0^-`': [
                ['0', '^', '_', '`'],
                ['0', '^-`'],
            ],
            '^0^-a': [
                ['0', '^', '_', '`', 'a'],
                ['0', '^-a'],
            ],
            '^0^-f': [
                ['0', '^-a', 'a-f'],
                ['0', '^-f'],
            ],
            '^0^a-f': [['0', '^', 'a-f']],
            '^0^a-fo-v': [['0', '^', 'a-f', 'o-v']],
            '^0-9^-f': [['0-9', '^-f']],
            '^0-9A-Z^': [['0-9', 'A-Z', '^']],
            '^0-9A-Z^-f': [['0-9', 'A-Z', '^-f']],
        },
        ({ pattern, expectedPattern, message }) => {
            const parser = p.chars(pattern);
            t.is(parser.pattern, expectedPattern, message);
            t.is(p2.chars(parser.pattern).pattern, expectedPattern, message);
        },
        patternsList => patternsList.map(pattern => `^${pattern}`),
    );
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const p2 = new ParserGenerator();

    t.is(p.chars('abcd123'), p.chars('abcd123'));
    t.is(p.chars('^abcd123'), p.chars('^abcd123'));
    t.is(
        p.chars('abcdef'),
        p.chars('a-f'),
        'If the set of characters is the same, the Parser object is also the same',
    );
    t.is(
        p.chars('0-90-9'),
        p.chars('0-9'),
        'If the set of characters is the same, the Parser object is also the same',
    );
    t.is(
        p.chars('0-93-7'),
        p.chars('0-9'),
        'If the set of characters is the same, the Parser object is also the same',
    );
    t.is(
        p.chars('3-70-9'),
        p.chars('0-9'),
        'If the set of characters is the same, the Parser object is also the same',
    );
    t.is(
        p.chars('0-45-9'),
        p.chars('0-9'),
        'If the set of characters is the same, the Parser object is also the same',
    );
    t.is(
        p.chars('a-gc-ie-k'),
        p.chars('a-k'),
        'If the set of characters is the same, the Parser object is also the same',
    );
    t.is(
        p.chars('^abcd123'),
        p.chars('^a-d1-3'),
        'If the set of characters is the same, the Parser object is also the same',
    );

    t.not(p.chars('abcd123'), p.chars('^abcd123'));
    t.not(
        p.chars('abcd123'),
        p2.chars('abcd123'),
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
});
