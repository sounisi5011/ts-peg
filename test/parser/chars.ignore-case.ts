import test, { ExecutionContext, Macro } from 'ava';
import { assertNotType, assertType, TypeEq } from 'typepark';
import util from 'util';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../src';
import { str2codePoints } from '../helpers';
import { asciiCharList } from '../helpers/chars';
import { parse } from '../helpers/parser';
import { assertExtendType } from '../helpers/type';

function testAsciiChars(
    t: ExecutionContext,
    parser: Parser<string>,
    isMatch: (char: string) => boolean,
): void {
    for (const asciiChar of asciiCharList) {
        const message = util.inspect({ asciiChar }, { breakLength: Infinity });
        if (isMatch(asciiChar)) {
            t.is(parse(parser, asciiChar)?.data, asciiChar, message);
            t.is(parse(parser, asciiChar + 'x')?.data, asciiChar, message);
            t.is(parse(parser, 'x' + asciiChar, 1)?.data, asciiChar, message);
            t.is(parse(parser, `x${asciiChar}x`, 1)?.data, asciiChar, message);
        } else {
            t.is(parse(parser, asciiChar)?.data, undefined, message);
            t.is(parse(parser, asciiChar + 'x')?.data, undefined, message);
            t.is(parse(parser, 'x' + asciiChar, 1)?.data, undefined, message);
            t.is(parse(parser, `x${asciiChar}x`, 1)?.data, undefined, message);
        }
    }
}

const shouldMatch: Macro<[string, string]> = (t, input, expected) => {
    const parser = p.chars(input).i;
    t.is(parse(parser, expected)?.data, expected, 'should match input');
    t.is(parser, p.chars(expected).i, 'should return same Parser objects');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
};
shouldMatch.title = (providedTitle, input, expected) =>
    (providedTitle ? `${providedTitle}: ` : '') +
    `[${str2codePoints(input)}] = [${str2codePoints(expected)}]`;

const shouldNotMatch: Macro<[string, string]> = (t, input, expected) => {
    const parser = p.chars(input).i;
    t.not(parse(parser, expected)?.data, expected, 'should not match input');
    t.not(
        parser,
        p.chars(expected).i,
        'should return different Parser objects',
    );
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
};
shouldNotMatch.title = (providedTitle, input, expected) =>
    (providedTitle?.trim() ? `${providedTitle.trim()}: ` : '') +
    `[${str2codePoints(input)}] ≠ [${str2codePoints(expected)}]`;

test('should match characters: "abc123"', t => {
    const parser = p.chars('abc123').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => /^[abc123]$/i.test(char));
    t.is(parse(parser, 'bca')?.data, 'b');
    t.is(parse(parser, '123')?.data, '1');
    t.is(parse(parser, '345')?.data, '3');

    t.is(parse(parser, 'hax')?.data, undefined);
    t.is(parse(parser, '813')?.data, undefined);
});

test('should match inverted characters: "^abc123"', t => {
    const parser = p.chars('^abc123').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => !/^[abc123]$/i.test(char));
    t.is(parse(parser, '893')?.data, '8');
    t.is(parse(parser, 'HAL 9000')?.data, 'H');
    t.is(parse(parser, '0123')?.data, '0');
});

test('should match character range: "a-f"', t => {
    const parser = p.chars('a-f').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => /^[a-f]$/i.test(char));
    t.is(parse(parser, 'baka')?.data, 'b');
    t.is(parse(parser, 'Fuse')?.data, 'F');
});

test('should match character range: "f-a"', t => {
    const parser = p.chars('f-a').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => /^[a-f]$/i.test(char));
    t.is(parse(parser, 'Affine')?.data, 'A');
    t.is(parse(parser, 'custard')?.data, 'c');
});

test('should match characters and character range: "0-9abc"', t => {
    const parser = p.chars('0-9abc').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => /^[0-9abc]$/i.test(char));
    t.is(parse(parser, '42')?.data, '4');
    t.is(parse(parser, '987')?.data, '9');
    t.is(parse(parser, 'abc')?.data, 'a');
    t.is(parse(parser, 'Bamboo')?.data, 'B');
    t.is(parse(parser, 'Cute')?.data, 'C');
});

test('should match inverted character range: "^a-f"', t => {
    const parser = p.chars('^a-f').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => !/^[a-f]$/i.test(char));
    t.is(parse(parser, 'Halo')?.data, 'H');
    t.is(parse(parser, '--')?.data, '-');
    t.is(parse(parser, 'APL')?.data, undefined);
    t.is(parse(parser, 'fantastic')?.data, undefined);
});

test('should match characters and "-": "abc-"', t => {
    const parser = p.chars('abc-').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => /^[abc-]$/i.test(char));
    t.is(parse(parser, 'Bca')?.data, 'B');
    t.is(parse(parser, '-c')?.data, '-');
    t.is(parse(parser, '-x')?.data, '-');
    t.is(parse(parser, 'hax')?.data, undefined);
    t.is(parse(parser, '813')?.data, undefined);
    t.is(parse(parser, '😊')?.data, undefined);
});

test('should match character range and "-": "-0-9"', t => {
    const parser = p.chars('-0-9').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, char => /^[-0-9]$/i.test(char));
    t.is(parse(parser, '456')?.data, '4');
    t.is(parse(parser, '9ab')?.data, '9');
    t.is(parse(parser, '-42')?.data, '-');
    t.is(parse(parser, '-x')?.data, '-');
    t.is(parse(parser, 'hax')?.data, undefined);
    t.is(parse(parser, 'APL')?.data, undefined);
    t.is(parse(parser, '😊')?.data, undefined);
});

test('should match all ASCII characters, including control characters', t => {
    const allAsciiChars = asciiCharList.join('');

    const parser = p.chars(allAsciiChars.replace(/-/g, '') + '-').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, () => true);
});

test('should match emoji (Unicode surrogate pair char) range', t => {
    const parser = p.chars('\uD83C\uDF47-\uD83C\uDF53').i; // U+1F347 - U+1F353
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '\u{1F347}')?.data, '🍇');
    t.is(parse(parser, '\u{1F348}\u{1F34C}')?.data, '🍈');
    t.is(parse(parser, '\u{1F348}\u{1F34C}', 2)?.data, '🍌');
    t.is(parse(parser, '\u{1F353}')?.data, '🍓');

    t.is(parse(parser, 'x')?.data, undefined);
    t.is(parse(parser, '\u{1F965}')?.data, undefined);
    t.is(
        parse(parser, '\uDF47')?.data,
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parse(parser, '\uD900')?.data,
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parse(parser, '\uD83C')?.data,
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parse(parser, '\u{1F348}\u{1F34C}', 1)?.data,
        undefined,
        'should not match surrogate char',
    );
    t.is(
        parse(parser, '\u{1F348}\u{1F34C}', 3)?.data,
        undefined,
        'should not match surrogate char',
    );
});

test('should match inverted emoji (Unicode surrogate pair char) range', t => {
    const parser = p.chars('^\uD83C\uDF47-\uD83C\uDF53').i; // ! U+1F347 - U+1F353
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
        parse(parser, '\u{1F348}\u{1F34C}', 1)?.data, // U+1F348 = U+D83C U+DF48
        '\uDF48',
        'should match surrogate char',
    );
    t.is(
        parse(parser, '\u{1F348}\u{1F34C}', 3)?.data, // U+1F34C = U+D83C U+DF4C
        '\uDF4C',
        'should match surrogate char',
    );

    t.is(
        parse(parser, '\u{1F347}')?.data,
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parse(parser, '\u{1F348}')?.data,
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parse(parser, '\u{1F34C}')?.data,
        undefined,
        'should not match emojis in inverted range',
    );
    t.is(
        parse(parser, '\u{1F353}')?.data,
        undefined,
        'should not match emojis in inverted range',
    );
});

test('should match Unicode surrogate char range', t => {
    const parser = p.chars('\uDC01-\uDFFF\uD800-\uDBFE').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, '\uD800')?.data, '\uD800');
    t.is(parse(parser, '\uD83Cx')?.data, '\uD83C');
    t.is(parse(parser, '\uDBFE')?.data, '\uDBFE');
    t.is(parse(parser, '\uDC01')?.data, '\uDC01');
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

    t.is(parse(parser, 'x')?.data, undefined);
    t.is(parse(parser, '\uDBFF')?.data, undefined);
    t.is(parse(parser, '\uDC00')?.data, undefined);
});

test('should match inverted Unicode surrogate char range', t => {
    const parser = p.chars('^\uD800-\uDFFF').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    t.is(parse(parser, 'x')?.data, 'x');
    t.is(
        parse(parser, '\uD83C\uDF47')?.data,
        '\uD83C\uDF47',
        `should match emoji char`,
    );

    t.is(parse(parser, '\uD800')?.data, undefined);
    t.is(parse(parser, '\uD83Cx')?.data, undefined);
    t.is(parse(parser, '\uDBFF')?.data, undefined);
    t.is(parse(parser, '\uDC00')?.data, undefined);
    t.is(parse(parser, '\uDFFF')?.data, undefined);
    t.is(parse(parser, '\uD83C\uD83C\uDF47')?.data, undefined);
});

test('should match emoji and Unicode surrogate char range', t => {
    const parser = p.chars('\uD800-\uDFFF\uD83C\uDF47-\uD83C\uDF53').i; // U+D800 - U+DFFF and U+1F347 - U+1F353
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

    t.is(parse(parser, 'x')?.data, undefined);
});

test('should not match empty string', t => {
    t.is(parse(p.chars('abc123').i, '')?.data, undefined);
});

test('should not match "^"', t => {
    const parser = p.chars('^^').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
    testAsciiChars(t, parser, char => char !== '^');
});

test('should not match "-"', t => {
    const parser = p.chars('^-a').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
    testAsciiChars(t, parser, char => !['-', 'a', 'A'].includes(char));
});

test('should always match', t => {
    const parser = p.chars('^').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, () => true);
    t.is(parse(parser, '123')?.data, '1');
    t.is(parse(parser, '')?.data, undefined);
});

test('should not always match', t => {
    const parser = p.chars('').i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();

    testAsciiChars(t, parser, () => false);
    t.is(parse(parser, '')?.data, undefined);
    t.is(parse(parser, '123')?.data, undefined);
});

test(String.raw`"\" is not an escape character`, t => {
    const parser = p.chars(String.raw`\-a`).i;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
    testAsciiChars(t, parser, char => /^[\\-a]$/i.test(char));
});

test('should not match one character', t => {
    t.is(parse(p.chars('a-z').i, 'ABC', 0, 1)?.data, 'A');
    t.is(parse(p.chars('a-z').i, 'ABC', 0, 0)?.data, undefined);
});

/**
 * @see https://engineering.linecorp.com/ja/blog/tolowercase-pitfalls-and-case-folding/
 * @see http://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */
{
    const title = 'should not match: "I" and dotted "I" / "i" and dotless "i"';

    test(title, shouldMatch, '\u{0049}', '\u{0049}');
    test(title, shouldMatch, '\u{0049}', '\u{0069}');
    test(title, shouldNotMatch, '\u{0049}', '\u{0130}');
    test(title, shouldNotMatch, '\u{0049}', '\u{0131}');

    test(title, shouldMatch, '\u{0069}', '\u{0049}');
    test(title, shouldMatch, '\u{0069}', '\u{0069}');
    test(title, shouldNotMatch, '\u{0069}', '\u{0130}');
    test(title, shouldNotMatch, '\u{0069}', '\u{0131}');

    test(title, shouldNotMatch, '\u{0130}', '\u{0049}');
    test(title, shouldNotMatch, '\u{0130}', '\u{0069}');
    test(title, shouldMatch, '\u{0130}', '\u{0130}');
    test(title, shouldNotMatch, '\u{0130}', '\u{0131}');

    test(title, shouldNotMatch, '\u{0131}', '\u{0049}');
    test(title, shouldNotMatch, '\u{0131}', '\u{0069}');
    test(title, shouldNotMatch, '\u{0131}', '\u{0130}');
    test(title, shouldMatch, '\u{0131}', '\u{0131}');
}

/**
 * @see https://engineering.linecorp.com/ja/blog/tolowercase-pitfalls-and-case-folding/
 * @see http://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */
{
    const title = 'should not match combining character sequence';

    test(title, shouldMatch, '\u{00CC}', '\u{00CC}');
    test(title, shouldMatch, '\u{00CC}', '\u{00EC}');

    test(title, shouldMatch, '\u{00EC}', '\u{00CC}');
    test(title, shouldMatch, '\u{00EC}', '\u{00EC}');

    test(title, shouldNotMatch, '\u{0049}\u{0300}', '\u{00CC}');
    test(title, shouldNotMatch, '\u{0049}\u{0300}', '\u{00EC}');

    test(title, shouldNotMatch, '\u{0069}\u{0300}', '\u{00CC}');
    test(title, shouldNotMatch, '\u{0069}\u{0300}', '\u{00EC}');
}

/**
 * @see https://engineering.linecorp.com/ja/blog/tolowercase-pitfalls-and-case-folding/
 * @see http://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */
{
    const title = 'should match lowercase eszett and uppercase eszett';

    test(title, shouldMatch, '\u{00DF}', '\u{00DF}');
    test(title, shouldMatch, '\u{00DF}', '\u{1E9E}');

    test(title, shouldMatch, '\u{1E9E}', '\u{00DF}');
    test(title, shouldMatch, '\u{1E9E}', '\u{1E9E}');
}

/**
 * @see https://engineering.linecorp.com/ja/blog/tolowercase-pitfalls-and-case-folding/
 * @see http://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */
{
    const title = 'should match three types of sigma';

    test(title, shouldMatch, '\u{03A3}', '\u{03A3}');
    test(title, shouldMatch, '\u{03A3}', '\u{03C2}');
    test(title, shouldMatch, '\u{03A3}', '\u{03C3}');

    test(title, shouldMatch, '\u{03C2}', '\u{03A3}');
    test(title, shouldMatch, '\u{03C2}', '\u{03C2}');
    test(title, shouldMatch, '\u{03C2}', '\u{03C3}');

    test(title, shouldMatch, '\u{03C3}', '\u{03A3}');
    test(title, shouldMatch, '\u{03C3}', '\u{03C2}');
    test(title, shouldMatch, '\u{03C3}', '\u{03C3}');
}

/**
 * @see https://bugs.mysql.com/bug.php?id=76553
 */
{
    const title = 'should not match sushi emoji and beer emoji';

    test(title, shouldMatch, '🍣', '🍣');
    test(title, shouldNotMatch, '🍣', '🍺');

    test(title, shouldNotMatch, '🍺', '🍣');
    test(title, shouldMatch, '🍺', '🍺');
}

test('if the arguments have the same value, they should return the same Parser object', t => {
    t.is(p.chars('abc').i, p.chars('abc').i);
    t.is(p.chars('abc').i, p.chars('bac').i);
    t.is(p.chars('abc').i, p.chars('ABC').i);
    t.is(p.chars('abc').i, p.chars('a-c').i);
    t.is(p.chars('abc').i, p.chars('A-C').i);

    t.is(p.chars('0-9').i, p.chars('0-9').i);
    t.is(p.chars('0-9').i, p.chars('9-0').i);
    t.is(p.chars('0-9').i, p.chars('0-9'));
    t.is(p.chars('a-z').i, p.chars('A-Z').i);
    t.is(p.chars('a-z').i, p.chars('a-zA-Z\u{017F}\u{212A}'));
    t.is(p.chars('a-z').i, p.chars('A-Za-z\u{212A}\u{017F}'));
    t.is(p.chars('z{-~').i, p.chars('Z{-~').i);
    t.is(p.chars('z{-~').i, p.chars('z-~').i);

    t.not(p.chars('z-~').i, p.chars('Z-~').i);
    t.not(p.chars('a-z').i, p.chars('a-z'));
    t.not(p.chars('a-z').i, p.chars('A-Z'));

    const p2 = new ParserGenerator();
    t.not(
        p.chars('abc').i,
        p2.chars('abc').i,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not(
        p.chars('abc').i,
        p2.chars('ABC').i,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
});

test('should exists unicodeVersion property', t => {
    const parser = p.chars('abc').i;
    t.regex(parser.unicodeVersion, /^[0-9]+(?:\.[0-9]+){2}$/);
    assertExtendType<string, typeof parser.unicodeVersion>();
    assertNotType<TypeEq<string, typeof parser.unicodeVersion>>();
});
