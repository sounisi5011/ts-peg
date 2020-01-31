import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { ParserGenerator, ParserResultDataType } from '../../../src';
import { parse } from '../../helpers/parser';

test('should convert result value', t => {
    {
        const parser = p.any;
        assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
        const textParser = parser.text;
        assertType<TypeEq<string, ParserResultDataType<typeof textParser>>>();

        t.is(parse(textParser, 'abc')?.data, 'a');
    }
    {
        const parser = p.any.value('xxx');
        assertType<TypeEq<'xxx', ParserResultDataType<typeof parser>>>();
        const textParser = parser.text;
        assertType<TypeEq<string, ParserResultDataType<typeof textParser>>>();

        t.is(parse(textParser, 'abc', 1)?.data, 'b');
    }
    {
        const parser = p.any.zeroOrMore;
        assertType<TypeEq<string[], ParserResultDataType<typeof parser>>>();
        const textParser = parser.text;
        assertType<TypeEq<string, ParserResultDataType<typeof textParser>>>();

        t.is(parse(textParser, 'abc')?.data, 'abc');
    }
    {
        const parser = p.any.value(42).oneOrMore;
        assertType<
            TypeEq<[42, ...42[]], ParserResultDataType<typeof parser>>
        >();
        const textParser = parser.text;
        assertType<TypeEq<string, ParserResultDataType<typeof textParser>>>();

        t.is(parse(textParser, 'abc')?.data, 'abc');
    }
    {
        const parser = p.any.oneOrMore.action(value => ({ value }));
        assertType<
            TypeEq<
                { value: [string, ...string[]] },
                ParserResultDataType<typeof parser>
            >
        >();
        const textParser = parser.text;
        assertType<TypeEq<string, ParserResultDataType<typeof textParser>>>();

        t.is(parse(textParser, 'abc')?.data, 'abc');
    }
});

test('should not match if starting offset is out of range', t => {
    t.is(parse(p.any.text, 'abc', 99), undefined);
});

test('should not invoke action callback', t => {
    let assertCallAction: () => void;
    let assertCount = 0;
    const parser = p.any.action(char => {
        assertCallAction();
        assertCount++;
        return { char };
    }).zeroOrMore;

    assertCallAction = () =>
        t.fail(
            'should not invoke action callback if only matched text is needed',
        );
    assertCount++;
    t.is(parse(parser.text, 'abc')?.data, 'abc');

    assertCallAction = () =>
        t.pass('should invoke action callback if not yet invoked the action');
    assertCount++;
    t.deepEqual(parse(parser, 'abc')?.data, [
        { char: 'a' },
        { char: 'b' },
        { char: 'c' },
    ]);

    assertCallAction = () =>
        t.pass(
            'should invoke action callback if the action has already been invoked',
        );
    assertCount++;
    t.deepEqual(parse(parser, 'abc')?.data, [
        { char: 'a' },
        { char: 'b' },
        { char: 'c' },
    ]);

    t.plan(assertCount + 2);
    t.deepEqual(
        parse(
            p.any.zeroOrMore.text.action(text => {
                t.pass(
                    'should invoke action callback if the result of action is needed',
                );
                return { text };
            }),
            'abc',
        )?.data,
        { text: 'abc' },
    );
});

test('getter property "text" should return the same Parser object', t => {
    const parser1α = p.str('α');
    const parser1β = p.str('β');
    const parser2α = new ParserGenerator().str('α');
    const opt1α1 = parser1α.text;
    const opt1α2 = parser1α.text;
    const opt1β1 = parser1β.text;
    const opt1β2 = parser1β.text;
    const opt2α1 = parser2α.text;
    const opt2α2 = parser2α.text;

    t.is(opt1α1, opt1α2);
    t.is(opt1β1, opt1β2);
    t.is(opt2α1, opt2α2);

    t.not(opt1α1, opt1β1);
    t.not(
        opt1α1,
        opt2α1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not(opt1β1, opt2α1);

    assertType<TypeEq<string, ParserResultDataType<typeof opt1α1>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof opt1α2>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof opt1β1>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof opt1β2>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof opt2α1>>>();
    assertType<TypeEq<string, ParserResultDataType<typeof opt2α2>>>();
});
