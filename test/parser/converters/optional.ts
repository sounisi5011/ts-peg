import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../../src';

test('should match', t => {
    t.is(p.any.optional.tryParse('abc', 0)?.data, 'a');
    {
        const parseResult = p.any.optional.tryParse('', 0);
        t.not(parseResult, undefined);
        t.is(parseResult?.data, undefined);
    }

    t.is(p.str('x').optional.tryParse('xxyyzz', 0)?.data, 'x');
    {
        const parseResult = p.str('x').optional.tryParse('xxyyzz', 3);
        t.not(parseResult, undefined);
        t.is(parseResult?.data, undefined);
    }
});

test('should not match if starting offset is out of range', t => {
    t.is(p.any.optional.tryParse('abc', 99), undefined);
});

test('getter property "optional" should return the same Parser object', t => {
    const parser1α = p.str('α');
    const parser1β = p.str('β');
    const parser2α = new ParserGenerator().str('α');
    const opt1α1 = parser1α.optional;
    const opt1α2 = parser1α.optional;
    const opt1β1 = parser1β.optional;
    const opt1β2 = parser1β.optional;
    const opt2α1 = parser2α.optional;
    const opt2α2 = parser2α.optional;

    t.is(opt1α1, opt1α2);
    t.is(opt1β1, opt1β2);
    t.is(opt2α1, opt2α2);

    t.not<Parser<string | undefined>>(opt1α1, opt1β1);
    t.not(
        opt1α1,
        opt2α1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not<Parser<string | undefined>>(opt1β1, opt2α1);

    assertType<TypeEq<'α' | undefined, ParserResultDataType<typeof opt1α1>>>();
    assertType<TypeEq<'α' | undefined, ParserResultDataType<typeof opt1α2>>>();
    assertType<TypeEq<'β' | undefined, ParserResultDataType<typeof opt1β1>>>();
    assertType<TypeEq<'β' | undefined, ParserResultDataType<typeof opt1β2>>>();
    assertType<TypeEq<'α' | undefined, ParserResultDataType<typeof opt2α1>>>();
    assertType<TypeEq<'α' | undefined, ParserResultDataType<typeof opt2α2>>>();
});
