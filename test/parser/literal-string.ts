import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, {
    LiteralStringParser,
    ParserGenerator,
    ParserResultDataType,
} from '../../src';
import { parse } from '../helpers/parser';

assertType<TypeEq<ParserResultDataType<LiteralStringParser<string>>, string>>();
assertType<TypeEq<ParserResultDataType<LiteralStringParser<'bar'>>, 'bar'>>();

test('should match string', t => {
    const parser = p.str('hoge');
    t.is(parse(parser, 'hoge fuga')?.data, 'hoge');
    t.is(parse(parser, 'foo bar hoge fuga', 8)?.data, 'hoge');
    assertType<TypeEq<'hoge', ParserResultDataType<typeof parser>>>();
});

test('should not match string', t => {
    const parser = p.str('hoge');
    t.is(parse(parser, 'hoge fuga', 1), undefined);
    t.is(parse(parser, 'foo bar hoge fuga', 7), undefined);
    t.is(parse(parser, 'hog'), undefined);
    t.is(parse(parser, 'oge'), undefined);
    t.is(parse(parser, 'hoge fuga', 0, 3), undefined);
    t.is(parse(parser, 'hoge fuga', 0, 2), undefined);
    t.is(parse(parser, 'hoge fuga', 0, 1), undefined);
    t.is(parse(parser, 'hoge fuga', 0, 0), undefined);
});

test('should not match empty string', t => {
    const parser = p.str('hoge');
    t.is(parse(parser, ''), undefined);
});

test('should not match if starting offset is out of range', t => {
    const parser = p.str('hoge');
    t.is(parse(parser, 'hoge', 99), undefined);
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

    assertType<TypeEq<'hoge', ParserResultDataType<typeof str1H1>>>();
    assertType<TypeEq<'fuga', ParserResultDataType<typeof str1F1>>>();
    assertType<TypeEq<'hoge', ParserResultDataType<typeof str1H2>>>();
    assertType<TypeEq<'fuga', ParserResultDataType<typeof str1F2>>>();
    assertType<TypeEq<'hoge', ParserResultDataType<typeof str2H1>>>();
    assertType<TypeEq<'fuga', ParserResultDataType<typeof str2F1>>>();
    assertType<TypeEq<'hoge', ParserResultDataType<typeof str2H2>>>();
    assertType<TypeEq<'fuga', ParserResultDataType<typeof str2F2>>>();
});
