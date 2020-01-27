/**
 * @see https://engineering.linecorp.com/ja/blog/tolowercase-pitfalls-and-case-folding/
 * @see https://tc39.es/ecma262/#sec-runtime-semantics-canonicalize-ch
 * @see https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-canonicalize-ch
 * @see http://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */

import test, { Macro } from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../src';

function str2codePoints(str: string): string {
    return [...str]
        .map(c =>
            c
                .codePointAt(0)
                ?.toString(16)
                .toUpperCase()
                .padStart(4, '0'),
        )
        .filter((code): code is string => typeof code === 'string')
        .map(code => `U+${code}`)
        .join(' ');
}

const shouldMatch: Macro<[string, string]> = (t, input, expected) => {
    const parser = p.str(input).i;
    t.is(parser.tryParse(expected, 0)?.data, expected, 'should match input');
    t.is.skip(parser, p.str(expected).i, 'should return same Parser objects');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
};
shouldMatch.title = (providedTitle, input, expected) =>
    (providedTitle ? `${providedTitle}: ` : '') +
    `[${str2codePoints(input)}] = [${str2codePoints(expected)}]`;

const shouldNotMatch: Macro<[string, string]> = (t, input, expected) => {
    const parser = p.str(input).i;
    t.is(
        parser.tryParse(expected, 0)?.data,
        undefined,
        'should not match input',
    );
    t.not.skip(
        parser,
        p.str(expected).i,
        'should return different Parser objects',
    );
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
};
shouldNotMatch.title = (providedTitle, input, expected) =>
    (providedTitle?.trim() ? `${providedTitle.trim()}: ` : '') +
    `[${str2codePoints(input)}] ≠ [${str2codePoints(expected)}]`;

// ----- ----- ----- ----- ----- //

test('should match string', t => {
    const parser = p.str('hoge').i;
    t.is(parser.tryParse('hoge', 0)?.data, 'hoge');
    t.is(parser.tryParse('foo Hoge', 4)?.data, 'Hoge');
    t.is(parser.tryParse('hOGe fuga', 0)?.data, 'hOGe');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
});

test('should not match string', t => {
    const parser = p.str('hoge').i;
    t.is(parser.tryParse('hooge', 0), undefined);
    t.is(parser.tryParse('foo Hoge', 0), undefined);
    t.is(parser.tryParse('hOGe fuga', 1), undefined);
    t.is(parser.tryParse('Hog', 0), undefined);
    t.is(parser.tryParse('h0ge', 0), undefined);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
});

test('should not match empty string', t => {
    const parser = p.str('hoge').i;
    t.is(parser.tryParse('', 0), undefined);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
});

test('should not match if starting offset is out of range', t => {
    const parser = p.str('hoge').i;
    t.is(parser.tryParse('hoge', 99), undefined);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
});

for (const asciiChar of [...Array(0x80).keys()].map(c =>
    String.fromCodePoint(c),
)) {
    test(
        'should match all ASCII characters',
        shouldMatch,
        asciiChar,
        asciiChar,
    );
    test(
        'should match all ASCII characters',
        shouldMatch,
        asciiChar + asciiChar,
        asciiChar + asciiChar,
    );
    test(
        'should match all ASCII characters',
        shouldMatch,
        `x${asciiChar}x`,
        `x${asciiChar}x`,
    );
}

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
    test(title, shouldNotMatch, '\u{00CC}', '\u{0049}\u{0300}');
    test(title, shouldNotMatch, '\u{00CC}', '\u{0069}\u{0300}');

    test(title, shouldMatch, '\u{00EC}', '\u{00CC}');
    test(title, shouldMatch, '\u{00EC}', '\u{00EC}');
    test(title, shouldNotMatch, '\u{00EC}', '\u{0049}\u{0300}');
    test(title, shouldNotMatch, '\u{00EC}', '\u{0069}\u{0300}');

    test(title, shouldNotMatch, '\u{0049}\u{0300}', '\u{00CC}');
    test(title, shouldNotMatch, '\u{0049}\u{0300}', '\u{00EC}');
    test(title, shouldMatch, '\u{0049}\u{0300}', '\u{0049}\u{0300}');
    test(title, shouldMatch, '\u{0049}\u{0300}', '\u{0069}\u{0300}');

    test(title, shouldNotMatch, '\u{0069}\u{0300}', '\u{00CC}');
    test(title, shouldNotMatch, '\u{0069}\u{0300}', '\u{00EC}');
    test(title, shouldMatch, '\u{0069}\u{0300}', '\u{0049}\u{0300}');
    test(title, shouldMatch, '\u{0069}\u{0300}', '\u{0069}\u{0300}');
}

/**
 * @see https://engineering.linecorp.com/ja/blog/tolowercase-pitfalls-and-case-folding/
 * @see http://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */
{
    const title = 'should match lowercase eszett and uppercase eszett';

    test(title, shouldMatch, '\u{00DF}', '\u{00DF}');
    test(title, shouldMatch, '\u{00DF}', '\u{1E9E}');
    test(title, shouldNotMatch, '\u{00DF}', '\u{0073}\u{0073}');

    test(title, shouldMatch, '\u{1E9E}', '\u{00DF}');
    test(title, shouldMatch, '\u{1E9E}', '\u{1E9E}');
    test(title, shouldNotMatch, '\u{1E9E}', '\u{0073}\u{0073}');

    test(title, shouldNotMatch, '\u{0073}\u{0073}', '\u{00DF}');
    test(title, shouldNotMatch, '\u{0073}\u{0073}', '\u{1E9E}');
    test(title, shouldMatch, '\u{0073}\u{0073}', '\u{0073}\u{0073}');
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

    test(title, shouldMatch, '\u{03A3}\u{03A3}', '\u{03A3}\u{03A3}');
    test(title, shouldMatch, '\u{03A3}\u{03A3}', '\u{03C3}\u{03C2}');
    test(title, shouldMatch, '\u{03A3}\u{03A3}', '\u{03C3}\u{03C3}');

    test(title, shouldMatch, '\u{03C3}\u{03C2}', '\u{03A3}\u{03A3}');
    test(title, shouldMatch, '\u{03C3}\u{03C2}', '\u{03C3}\u{03C2}');
    test(title, shouldMatch, '\u{03C3}\u{03C2}', '\u{03C3}\u{03C3}');

    test(title, shouldMatch, '\u{03C3}\u{03C3}', '\u{03A3}\u{03A3}');
    test(title, shouldMatch, '\u{03C3}\u{03C3}', '\u{03C3}\u{03C2}');
    test(title, shouldMatch, '\u{03C3}\u{03C3}', '\u{03C3}\u{03C3}');
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

/**
 * @see https://yassu.jp/pukiwiki/index.php?MySQL%20%BC%F7%BB%CA%A5%D3%A1%BC%A5%EB%CC%E4%C2%EA#ia0f0e09
 */
{
    const title =
        'should not match between japanese mother (haha, ハハ), dad (papa, パパ) and old woman (baba, ババ)';

    test(title, shouldMatch, 'ハハ', 'ハハ');
    test(title, shouldNotMatch, 'ハハ', 'パパ');
    test(title, shouldNotMatch, 'ハハ', 'ババ');

    test(title, shouldNotMatch, 'パパ', 'ハハ');
    test(title, shouldMatch, 'パパ', 'パパ');
    test(title, shouldNotMatch, 'パパ', 'ババ');

    test(title, shouldNotMatch, 'ババ', 'ハハ');
    test(title, shouldNotMatch, 'ババ', 'パパ');
    test(title, shouldMatch, 'ババ', 'ババ');
}

/**
 * @see https://labs.gree.jp/blog/2017/04/16406/
 */
{
    const title =
        'should not match japanese hospital (びょういん) and beauty parlor (びよういん)';

    test(title, shouldMatch, 'びょういん', 'びょういん');
    test(title, shouldNotMatch, 'びょういん', 'びよういん');

    test(title, shouldNotMatch, 'びよういん', 'びょういん');
    test(title, shouldMatch, 'びよういん', 'びよういん');
}

test.skip('if the arguments have the same value, they should return the same Parser object', t => {
    const p2 = new ParserGenerator();
    const str1Shoge = p.str('hoge').i;
    const str2Shoge = p2.str('hoge').i;
    const str1Sfuss = p.str('fuss').i;
    const str1Sfuß = p.str('fuß').i;

    t.is(str1Shoge, p.str('hoge').i);
    t.is(str1Shoge, p.str('Hoge').i);
    t.is(str1Shoge, p.str('HOGE').i);
    t.is(str1Shoge, p.str('hoGe').i);
    t.is(str1Sfuss, p.str('FUSS').i);
    t.is(str1Sfuß, p.str('FUß').i);
    t.is(str1Sfuß, p.str('fu\u{1E9E}').i);

    t.not(str1Shoge, p.str('hge').i);
    t.not(str1Shoge, p.str('H0GE').i);
    t.not<Parser<string>>(str1Shoge, p.str('hoge'));
    t.not(
        str1Shoge,
        str2Shoge,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not(str1Sfuss, str1Sfuß);

    assertType<TypeEq<string, ParserResultDataType<typeof str1Shoge>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof str2Shoge>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof str1Sfuss>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof str1Sfuß>>>();
});
