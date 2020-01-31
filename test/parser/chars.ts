import test from 'ava';
import * as iterTools from 'iter-tools';
import { assertType, TypeEq } from 'typepark';
import util from 'util';

import p, {
    CharacterClassParser,
    ParserGenerator,
    ParserResultDataType,
} from '../../src';
import { parse } from '../helpers/parser';
import { OneOrMoreArray } from '../helpers/type';

assertType<TypeEq<ParserResultDataType<CharacterClassParser>, string>>();

test('should match characters: "abc123"', t => {
    const parser = p.chars('abc123');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'a')?.data, 'a');
    t.is(parse(parser, 'bca')?.data, 'b');
    t.is(parse(parser, '123')?.data, '1');
    t.is(parse(parser, '345')?.data, '3');

    t.is(parse(parser, 'hax'), undefined);
    t.is(parse(parser, '813'), undefined);
});

test('should match inverted characters: "^abc123"', t => {
    const parser = p.chars('^abc123');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'h')?.data, 'h');
    t.is(parse(parser, '893')?.data, '8');
    t.is(parse(parser, 'HAL 9000')?.data, 'H');
    t.is(parse(parser, '0123')?.data, '0');

    t.is(parse(parser, '1'), undefined);
    t.is(parse(parser, '2'), undefined);
    t.is(parse(parser, '3'), undefined);
    t.is(parse(parser, 'a'), undefined);
    t.is(parse(parser, 'b'), undefined);
    t.is(parse(parser, 'c'), undefined);
});

test('should match character range: "a-f"', t => {
    const parser = p.chars('a-f');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'a')?.data, 'a');
    t.is(parse(parser, 'baka')?.data, 'b');
    t.is(parse(parser, 'fuse')?.data, 'f');

    t.is(parse(parser, '2'), undefined);
    t.is(parse(parser, 'x'), undefined);
    t.is(parse(parser, '-'), undefined);
});

test('should match character range: "f-a"', t => {
    const parser = p.chars('f-a');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'f')?.data, 'f');
    t.is(parse(parser, 'affine')?.data, 'a');
    t.is(parse(parser, 'custard')?.data, 'c');

    t.is(parse(parser, '2'), undefined);
    t.is(parse(parser, 'x'), undefined);
    t.is(parse(parser, '-'), undefined);
});

test('should match characters and character range: "0-9abc"', t => {
    const parser = p.chars('0-9abc');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '0')?.data, '0');
    t.is(parse(parser, '42')?.data, '4');
    t.is(parse(parser, '987')?.data, '9');
    t.is(parse(parser, 'abc')?.data, 'a');
    t.is(parse(parser, 'bamboo')?.data, 'b');
    t.is(parse(parser, 'cute')?.data, 'c');

    t.is(parse(parser, 'x'), undefined);
    t.is(parse(parser, 'A'), undefined);
    t.is(parse(parser, '-'), undefined);
});

test('should match inverted character range: "^a-f"', t => {
    const parser = p.chars('^a-f');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '2')?.data, '2');
    t.is(parse(parser, 'APL')?.data, 'A');
    t.is(parse(parser, 'Halo')?.data, 'H');
    t.is(parse(parser, '--')?.data, '-');

    t.is(parse(parser, 'a'), undefined);
    t.is(parse(parser, 'fantastic'), undefined);
});

test('should match characters and "-": "abc-"', t => {
    const parser = p.chars('abc-');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'a')?.data, 'a');
    t.is(parse(parser, 'bca')?.data, 'b');
    t.is(parse(parser, '-c')?.data, '-');
    t.is(parse(parser, '-x')?.data, '-');

    t.is(parse(parser, 'hax'), undefined);
    t.is(parse(parser, '813'), undefined);
    t.is(parse(parser, '😊'), undefined);
});

test('should match character range and "-": "-0-9"', t => {
    const parser = p.chars('-0-9');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '0')?.data, '0');
    t.is(parse(parser, '456')?.data, '4');
    t.is(parse(parser, '9ab')?.data, '9');
    t.is(parse(parser, '-42')?.data, '-');
    t.is(parse(parser, '-x')?.data, '-');

    t.is(parse(parser, 'hax'), undefined);
    t.is(parse(parser, 'APL'), undefined);
    t.is(parse(parser, '😊'), undefined);
});

test('should match all ASCII characters, including control characters', t => {
    const allAsciiChars = [...Array(0x80).keys()]
        .map(c => String.fromCodePoint(c))
        .join('');

    const parser = p.chars(allAsciiChars.replace(/-/g, '') + '-');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    for (const controlChar of allAsciiChars) {
        const message = util.inspect(
            { controlChar },
            { breakLength: Infinity },
        );
        t.is(parse(parser, controlChar)?.data, controlChar, message);
        t.is(parse(parser, controlChar + 'x')?.data, controlChar, message);
        t.is(parse(parser, 'x' + controlChar, 1)?.data, controlChar, message);
    }
});

test('should match emoji (Unicode surrogate pair char) range', t => {
    const parser = p.chars('\uD83C\uDF47-\uD83C\uDF53'); // U+1F347 - U+1F353
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '\u{1F347}')?.data, '🍇');
    t.is(parse(parser, '\u{1F348}\u{1F34C}')?.data, '🍈');
    t.is(parse(parser, '\u{1F348}\u{1F34C}', 2)?.data, '🍌');
    t.is(parse(parser, '\u{1F353}')?.data, '🍓');

    t.is(parse(parser, 'x'), undefined);
    t.is(parse(parser, '\u{1F965}'), undefined);
    t.is(parse(parser, '\uDF47'), undefined, 'should not match surrogate char');
    t.is(parse(parser, '\uD900'), undefined, 'should not match surrogate char');
    t.is(parse(parser, '\uD83C'), undefined, 'should not match surrogate char');
    t.is(
        parse(parser, '\u{1F348}\u{1F34C}', 1),
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parse(parser, '\u{1F348}\u{1F34C}', 3),
        undefined,
        'should not match surrogate char',
    );
});

test('should match inverted emoji (Unicode surrogate pair char) range', t => {
    const parser = p.chars('^\uD83C\uDF47-\uD83C\uDF53'); // ! U+1F347 - U+1F353
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'x')?.data, 'x');
    t.is(parse(parser, '\u{1F4A9}')?.data, '💩');
    t.is(
        parse(parser, '\uD83C')?.data,
        '\uD83C',
        'should match surrogate char',
    );
    t.is(
        parse(parser, '\uDF47')?.data,
        '\uDF47',
        'should match surrogate char',
    );
    t.is(
        parse(parser, '\uDF53')?.data,
        '\uDF53',
        'should match surrogate char',
    );
    t.is(
        parse(parser, '\u{1F348}\u{1F34C}', 1)?.data,
        '\uDF48',
        'should match surrogate char',
    );
    t.is(
        parse(parser, '\u{1F348}\u{1F34C}', 3)?.data,
        '\uDF4C',
        'should match surrogate char',
    );

    t.is(
        parse(parser, '\u{1F347}'),
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parse(parser, '\u{1F348}'),
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parse(parser, '\u{1F34C}'),
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parse(parser, '\u{1F353}'),
        undefined,
        'should not match emojis in inverted range',
    );
});

test('should match Unicode surrogate char range', t => {
    const parser = p.chars('\uDC00-\uDFFF\uD800-\uDBFF');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '\uD800')?.data, '\uD800');
    t.is(parse(parser, '\uD83Cx')?.data, '\uD83C');
    t.is(parse(parser, '\uDBFF')?.data, '\uDBFF');
    t.is(parse(parser, '\uDC00')?.data, '\uDC00');
    t.is(parse(parser, '\uDFFF')?.data, '\uDFFF');
    t.is(
        parse(parser, '\uD83C\uDF47')?.data,
        '\uD83C',
        `should match emoji's high surrogate char`,
    );
    t.is(
        parse(parser, '\uD83C\uDF47', 1)?.data,
        '\uDF47',
        `should match emoji's low surrogate char`,
    );

    t.is(parse(parser, 'x'), undefined);
});

test('should match inverted Unicode surrogate char range', t => {
    const parser = p.chars('^\uD800-\uDFFF');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'x')?.data, 'x');
    t.is(
        parse(parser, '\uD83C\uDF47')?.data,
        '\uD83C\uDF47',
        `should match emoji char`,
    );

    t.is(parse(parser, '\uD800'), undefined);
    t.is(parse(parser, '\uD83Cx'), undefined);
    t.is(parse(parser, '\uDBFF'), undefined);
    t.is(parse(parser, '\uDC00'), undefined);
    t.is(parse(parser, '\uDFFF'), undefined);
    t.is(parse(parser, '\uD83C\uD83C\uDF47'), undefined);
});

test('should match emoji and Unicode surrogate char range', t => {
    const parser = p.chars('\uD800-\uDFFF\uD83C\uDF47-\uD83C\uDF53'); // U+D800 - U+DFFF and U+1F347 - U+1F353
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '\uD800')?.data, '\uD800');
    t.is(parse(parser, '\uDBFF')?.data, '\uDBFF');
    t.is(parse(parser, '\uDC00')?.data, '\uDC00');
    t.is(parse(parser, '\uDFFF')?.data, '\uDFFF');
    t.is(
        parse(parser, '\u{1F347}')?.data,
        '\u{1F347}',
        `should match emojis in range`,
    );
    t.is(
        parse(parser, '\u{1F353}')?.data,
        '\u{1F353}',
        `should match emojis in range`,
    );
    t.is(
        parse(parser, '\u{1F4A9}')?.data, // U+1F4A9 = U+D83D U+DCA9
        '\uD83D',
        `should match out-of-range emojis high surrogate char`,
    );

    t.is(parse(parser, 'x'), undefined);
});

test('should not match empty string', t => {
    t.is(parse(p.chars('abc123'), ''), undefined);
});

test('should not match "^"', t => {
    const parser = p.chars('^^');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '^'), undefined);
    t.is(parse(parser, 'abc')?.data, 'a');
});

test('should not match "-"', t => {
    const parser = p.chars('^-a');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '-'), undefined);
    t.is(parse(parser, 'a'), undefined);
    t.is(parse(parser, '^')?.data, '^');
});

test('should always match', t => {
    const parser = p.chars('^');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'a')?.data, 'a');
    t.is(parse(parser, '123')?.data, '1');
    t.is(parse(parser, '^')?.data, '^');
    t.is(parse(parser, '-')?.data, '-');
    t.is(parse(parser, '\0')?.data, '\0');

    t.is(parse(parser, ''), undefined);
});

test('should not always match', t => {
    const parser = p.chars('');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, ''), undefined);
    t.is(parse(parser, 'a'), undefined);
    t.is(parse(parser, '123'), undefined);
    t.is(parse(parser, '^'), undefined);
    t.is(parse(parser, '-'), undefined);
    t.is(parse(parser, '\0'), undefined);
});

test(String.raw`"\" is not an escape character`, t => {
    const parser = p.chars(String.raw`\-a`);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '\\')?.data, '\\');
    t.is(parse(parser, 'a')?.data, 'a');

    t.is(
        parse(parser, '-'),
        undefined,
        String.raw`"-" outside range of "\" to "a" should not match`,
    );
});

test('should not match one character', t => {
    t.is(parse(p.chars('a-z'), 'abc', 0, 1)?.data, 'a');
    t.is(parse(p.chars('a-z'), 'abc', 0, 0), undefined);
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
    patternsListConverter: (
        patternsList: string[],
        expectedPattern: string,
    ) => (
        | string
        | { patternsList: string[]; expectedPattern: string }
    )[] = list => list,
): void {
    for (const [expectedPattern, patternsList] of Object.entries(patternsDef)) {
        for (const patterns of typeof patternsList === 'string'
            ? [patternsList]
            : patternsList) {
            const convertedPatterns = patternsListConverter(
                typeof patterns === 'string'
                    ? patternCombinations(patterns)
                    : patternCombinations(...patterns),
                expectedPattern,
            ).map(pattern =>
                typeof pattern === 'string'
                    ? { patternsList: [pattern], expectedPattern }
                    : pattern,
            );
            for (const { patternsList, expectedPattern } of convertedPatterns) {
                for (const pattern of patternsList) {
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
}

test('validate "pattern" property value', t => {
    const p2 = new ParserGenerator();

    patternTest(
        {
            a: 'a',
            '-': '-',
            'a-z': 'a-z',
            '0-9': [
                ['0-9', '0-9'],
                ['0-9', '3-7'],
                ['0-4', '4-9'],
                ['0-4', '5-9'],
            ],
            '0-46-9': [['0-4', '6-9']],
            '0-9a-f': [['0-9', 'a-f']],
            'a-k': [['a-g', 'c-i', 'e-k']],
            '-0-9A-Z_a-z': [['0-9', 'a-z', 'A-Z', '_', '-']],
            '--9': '--9',
            '*-9': ['*-9', ['-', '*-9']],
            '!-*-0-9': [['!-*', '0-9', '-']],
            '12': [['1', '2'], '1-2'],
            '1-3': [['1', '2', '3'], ['12', '23'], '1-3'],
            '1-3a-d': [
                ['abcd', '123'],
                ['ab', 'cd', '123'],
                ['a-d', '123'],
                ['abcd', '1-3'],
                ['a-d', '1-3'],
            ],
            // see https://github.com/tc39/proposal-regexp-dotall-flag
            '\u000A': '\u000A',
            '\u000B': '\u000B',
            '\u000C': '\u000C',
            '\u000D': '\u000D',
            '\u000A\u000D': '\r\n',
            '\u0085': '\u0085',
            '\u2028': '\u2028',
            '\u2029': '\u2029',
        },
        ({ pattern, expectedPattern, message }) => {
            const parser = p.chars(pattern);
            t.is(parser.pattern, expectedPattern, message);
            t.is(p2.chars(parser.pattern).pattern, expectedPattern, message);
        },
        (patterns, expectedPattern) => {
            const patternsList = patterns.filter(
                pattern =>
                    !(
                        expectedPattern === '-0-9A-Z_a-z' &&
                        pattern.includes('_-')
                    ),
            );
            return [
                { expectedPattern, patternsList },
                {
                    expectedPattern: `^${expectedPattern}`,
                    patternsList: patternsList.map(pattern => `^${pattern}`),
                },
            ];
        },
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
            '0-9A-Z^-f': [['0-9', 'A-Z', '^-f']],
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

test('validate "pattern" property value: "-" should be a pattern or character range prefix or suffix', t => {
    const p2 = new ParserGenerator();

    patternTest(
        {
            '-': ['-'],
            '--9': ['--9'],
            '!--': ['!--'],
            '!9-': [['!', '-', '9']],
            ',9-': [[',', '-', '9']],
            '!.-': [['!', '-', '.']],
            ',-.': [[',', '-', '.']], // "," and "-" and "."  =  U+002C and U+002D and U+002E  =  U+002C - U+002E  =  "," - "."
            '!.a-z-': [['!', '-', '.', 'a-z']],
            ',-.a-z': [[',', '-', '.', 'a-z']],
            '!.0-9-a-z': [['!', '-', '.', '0-9', 'a-z']],
            ',-.0-9a-z': [[',', '-', '.', '0-9', 'a-z']],
            '!-%*/A-Z-': [['!-%', '*', '-', '/', 'A-Z']],
            '!-%*/A-Z-a-z': [['!-%', '*', '-', '/', 'A-Z', 'a-z']],
            '!-%*/1-9-A-Z': [['!-%', '*', '-', '/', '1-9', 'A-Z']],
            '!-%*/1-9-A-Za-z': [['!-%', '*', '-', '/', '1-9', 'A-Z', 'a-z']],
            '!-%-^z': [['!-%', '-', '^', 'z']],
        },
        ({ pattern, expectedPattern, message }) => {
            const parser = p.chars(pattern);
            t.is(parser.pattern, expectedPattern, message);
            t.is(p2.chars(parser.pattern).pattern, expectedPattern, message);
        },
        (patternsList, expectedPattern) => {
            const expectedPatternParts = new Set(
                expectedPattern.match(/.-.|./gsu) || [],
            );
            if (expectedPatternParts.has(',-.')) {
                expectedPatternParts.add(',');
                expectedPatternParts.add('-');
                expectedPatternParts.add('.');
            }

            const newPatternsList = patternsList.filter(pattern =>
                (pattern.match(/.-.|./gsu) || []).every(
                    part =>
                        expectedPatternParts.has(part) ||
                        expectedPatternParts.has([...part].reverse().join('')),
                ),
            );
            return [
                {
                    expectedPattern,
                    patternsList: newPatternsList.filter(
                        pattern => !/^\^/.test(pattern),
                    ),
                },
                {
                    expectedPattern: `^${expectedPattern}`,
                    patternsList: newPatternsList.map(pattern => `^${pattern}`),
                },
            ];
        },
    );
});

test('validate "pattern" property value: low surrogate char cannot be placed after high surrogate char', t => {
    function e(str: string): string {
        return [...str]
            .map(char => {
                if (/^[!-~]$/.test(char)) return char;
                const code = char
                    .codePointAt(0)
                    ?.toString(16)
                    .toUpperCase()
                    .padStart(4, '0');
                if (typeof code !== 'string') return code;
                return `U+${code}`;
            })
            .filter((code): code is string => typeof code === 'string')
            .join(' ');
    }

    const p2 = new ParserGenerator();
    {
        const parser = p.chars('\uDC00-\uDFFF\uD800-\uDBFF');
        t.is(e(parser.pattern), e('\uD800-\uDFFF'));
        t.is(e(p2.chars(parser.pattern).pattern), e('\uD800-\uDFFF'));
    }
    {
        const parser = p.chars('\uDC01-\uDFFF\uD800-\uDBFF');
        t.is(e(parser.pattern), e('\uDC01-\uDFFF\uD800-\uDBFF'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('\uDC01-\uDFFF\uD800-\uDBFF'),
        );
    }
    {
        const parser = p.chars('\uDC01\uDE89\uD807\uD800');
        t.is(e(parser.pattern), e('\uDC01\uDE89\uD800\uD807'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('\uDC01\uDE89\uD800\uD807'),
        );
    }
    {
        const parser = p.chars('\uD807\uD800x\uDC01\uDE89');
        t.is(e(parser.pattern), e('x\uDC01\uDE89\uD800\uD807'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('x\uDC01\uDE89\uD800\uD807'),
        );
    }
    {
        const parser = p.chars('\uD807\uD800\u{1F351}\uDC01\uDE89');
        t.is(e(parser.pattern), e('\uDC01\uDE89\uD800\uD807\u{1F351}'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('\uDC01\uDE89\uD800\uD807\u{1F351}'),
        );
    }
    {
        const parser = p.chars('\uD807\uD800x\u{1F351}\uDC01\uDE89');
        t.is(e(parser.pattern), e('x\uDC01\uDE89\uD800\uD807\u{1F351}'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('x\uDC01\uDE89\uD800\uD807\u{1F351}'),
        );
    }
    {
        const parser = p.chars('\uDE0E-\u{1F000}h-\uDA98');
        t.is(e(parser.pattern), e('\uDE0E-\u{1F000}h-\uDA98'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('\uDE0E-\u{1F000}h-\uDA98'),
        );
    }
    {
        const parser = p.chars('\uDF09\uDF01\uDC01-\uDBFE\uD805\uD801');
        t.is(e(parser.pattern), e('\uDF01\uDF09\uD801\uD805\uDBFE-\uDC01'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('\uDF01\uDF09\uD801\uD805\uDBFE-\uDC01'),
        );
    }
    {
        const parser = p.chars(
            'a-z\uDC00-\uDFFF\uD800-\uDBFF\u{1F000}-\u{1F02F}',
        );
        t.is(e(parser.pattern), e('a-z\uD800-\uDFFF\u{1F000}-\u{1F02F}'));
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('a-z\uD800-\uDFFF\u{1F000}-\u{1F02F}'),
        );
    }
    {
        const parser = p.chars(
            'a-zZ-E\uDC00-\uDFFF\uD800-\uDBFE\u{1F02F}-\u{1F000}',
        );
        t.is(
            e(parser.pattern),
            e('E-Za-z\uDC00-\uDFFF\uD800-\uDBFE\u{1F000}-\u{1F02F}'),
        );
        t.is(
            e(p2.chars(parser.pattern).pattern),
            e('E-Za-z\uDC00-\uDFFF\uD800-\uDBFE\u{1F000}-\u{1F02F}'),
        );
    }
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
