import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator } from '../../../src';

test('should match', t => {
    t.deepEqual(p.any.optional.tryParse('abc', 0), {
        offsetEnd: 1,
        data: 'a',
    });
    t.deepEqual(p.any.optional.tryParse('', 0), {
        offsetEnd: 0,
        data: undefined,
    });
    t.deepEqual(p.str('x').optional.tryParse('xxyyzz', 0), {
        offsetEnd: 1,
        data: 'x',
    });
    t.deepEqual(p.str('x').optional.tryParse('xxyyzz', 3), {
        offsetEnd: 3,
        data: undefined,
    });
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

    assertType<TypeEq<typeof opt1α1, Parser<'α' | undefined>>>();
    assertType<TypeEq<typeof opt1α2, Parser<'α' | undefined>>>();
    assertType<TypeEq<typeof opt1β1, Parser<'β' | undefined>>>();
    assertType<TypeEq<typeof opt1β2, Parser<'β' | undefined>>>();
    assertType<TypeEq<typeof opt2α1, Parser<'α' | undefined>>>();
    assertType<TypeEq<typeof opt2α2, Parser<'α' | undefined>>>();
});
