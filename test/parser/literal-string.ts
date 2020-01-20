import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, {
    LiteralStringParser,
    ParserGenerator,
    ParserResultDataType,
} from '../../src';

assertType<TypeEq<ParserResultDataType<LiteralStringParser<string>>, string>>();
assertType<TypeEq<ParserResultDataType<LiteralStringParser<'bar'>>, 'bar'>>();

test('should match string', t => {
    t.deepEqual(p.str('hoge').tryParse('hoge fuga', 0), {
        offsetEnd: 4,
        data: 'hoge',
    });
    t.deepEqual(p.str('hoge').tryParse('foo bar hoge fuga', 8), {
        offsetEnd: 12,
        data: 'hoge',
    });
});

test('should not match string', t => {
    t.is(p.str('hoge').tryParse('hoge fuga', 1), undefined);
    t.is(p.str('hoge').tryParse('foo bar hoge fuga', 7), undefined);
    t.is(p.str('hoge').tryParse('hog', 0), undefined);
    t.is(p.str('hoge').tryParse('oge', 0), undefined);
});

test('should not match empty string', t => {
    t.is(p.str('hoge').tryParse('', 0), undefined);
});

test('should not match if starting offset is out of range', t => {
    t.is(p.str('hoge').tryParse('hoge', 99), undefined);
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const p2 = new ParserGenerator();
    const str1H1 = p.str('hoge');
    const str1F1 = p.str('fuga');
    const str1H2 = p.str('hoge');
    const str1F2 = p.str('fuga');
    const str2H1 = p2.str('hoge');
    const str2F1 = p2.str('fuga');
    const str2H2 = p2.str('hoge');
    const str2F2 = p2.str('fuga');

    t.is(str1H1, str1H2);
    t.is(str1F1, str1F2);
    t.is(str2H1, str2H2);
    t.is(str2F1, str2F2);

    t.not<LiteralStringParser<string>>(str1H1, str1F1);
    t.not<LiteralStringParser<string>>(str2H1, str2F1);

    t.not(
        str1H1,
        str2H1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not(
        str1F1,
        str2F1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );

    assertType<TypeEq<typeof str1H1, LiteralStringParser<'hoge'>>>();
    assertType<TypeEq<typeof str1F1, LiteralStringParser<'fuga'>>>();
    assertType<TypeEq<typeof str1H2, LiteralStringParser<'hoge'>>>();
    assertType<TypeEq<typeof str1F2, LiteralStringParser<'fuga'>>>();
    assertType<TypeEq<typeof str2H1, LiteralStringParser<'hoge'>>>();
    assertType<TypeEq<typeof str2F1, LiteralStringParser<'fuga'>>>();
    assertType<TypeEq<typeof str2H2, LiteralStringParser<'hoge'>>>();
    assertType<TypeEq<typeof str2F2, LiteralStringParser<'fuga'>>>();
});
