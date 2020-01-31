import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../../src';
import { parse } from '../../helpers/parser';

test('should match', t => {
    t.is(parse(p.any.optional, 'abc')?.data, 'a');
    t.deepEqual(parse(p.any.optional, ''), {
        data: undefined,
        offsetEnd: 0,
    });
    t.deepEqual(parse(p.any.optional, 'abc', 0, 0), {
        data: undefined,
        offsetEnd: 0,
    });
    t.is(parse(p.any.optional, 'abc', 0, 1)?.data, 'a');

    t.is(parse(p.str('x').optional, 'xxyyzz')?.data, 'x');
    t.deepEqual(parse(p.str('x').optional, 'xxyyzz', 3), {
        data: undefined,
        offsetEnd: 3,
    });
    t.deepEqual(parse(p.str('x').optional, 'xxyyzz', 0, 0), {
        data: undefined,
        offsetEnd: 0,
    });
});

test('should not match if starting offset is out of range', t => {
    t.is(parse(p.any.optional, 'abc', 99), undefined);
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
