import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator } from '../../src';

test('should match characters: "abc123"', t => {
    const parser = p.chars('abc123');
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

    t.deepEqual(parser.tryParse('\u{1F347}', 0), {
        offsetEnd: 2,
        data: '🍇',
    });
    t.deepEqual(parser.tryParse('\u{1F348}', 0), {
        offsetEnd: 2,
        data: '🍈',
    });
    t.deepEqual(parser.tryParse('\u{1F34C}', 0), {
        offsetEnd: 2,
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
});

test('should match inverted emoji (Unicode surrogate pair char) range', t => {
    const parser = p.chars('^\uD83C\uDF47-\uD83C\uDF53'); // ! U+1F347 - U+1F353
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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

    t.is(parser.tryParse('x', 0), undefined);
});

test('should match inverted Unicode surrogate char range', t => {
    const parser = p.chars('^\uD800-\uDFFF');
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

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
    assertType<TypeEq<typeof parser, Parser<string>>>();

    t.is(parser.tryParse('^', 0), undefined);
    t.deepEqual(parser.tryParse('abc', 0), {
        offsetEnd: 1,
        data: 'a',
    });
});

test('should not match "-"', t => {
    const parser = p.chars('^-a');
    assertType<TypeEq<typeof parser, Parser<string>>>();

    t.is(parser.tryParse('-', 0), undefined);
    t.is(parser.tryParse('a', 0), undefined);
    t.deepEqual(parser.tryParse('^', 0), {
        offsetEnd: 1,
        data: '^',
    });
});

test(String.raw`"\" is not an escape character`, t => {
    const parser = p.chars(String.raw`\-a`);
    assertType<TypeEq<typeof parser, Parser<string>>>();

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

test('if the arguments have the same value, they should return the same Parser object', t => {
    const p2 = new ParserGenerator();
    const chars11 = p.chars('abcd123');
    const chars12 = p.chars('abcd123');
    const chars13 = p.chars('123a-d');
    const chars1i1 = p.chars('^abcd123');
    const chars1i2 = p.chars('^abcd123');
    const chars1i3 = p.chars('^a-d1-3');
    const chars21 = p2.chars('abcd123');

    t.is(chars11, chars12);
    t.is(chars1i1, chars1i2);
    t.is(
        chars11,
        chars13,
        'If the set of characters is the same, the Parser object is also the same',
    );
    t.is(
        chars1i1,
        chars1i3,
        'If the set of characters is the same, the Parser object is also the same',
    );

    t.not(chars11, chars1i1);
    t.not(
        chars11,
        chars21,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    assertType<TypeEq<typeof chars11, Parser<string>>>();
    assertType<TypeEq<typeof chars12, Parser<string>>>();
    assertType<TypeEq<typeof chars13, Parser<string>>>();
    assertType<TypeEq<typeof chars1i1, Parser<string>>>();
    assertType<TypeEq<typeof chars1i2, Parser<string>>>();
    assertType<TypeEq<typeof chars1i3, Parser<string>>>();
    assertType<TypeEq<typeof chars21, Parser<string>>>();
});
