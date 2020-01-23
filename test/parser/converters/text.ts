import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator } from '../../../src';
import { assertExtendType } from '../../helpers/type';

test('should convert result value', t => {
    {
        const parser = p.any;
        assertExtendType<Parser<string>, typeof parser>();
        const textParser = parser.text;
        assertExtendType<Parser<string>, typeof textParser>();

        t.deepEqual(textParser.tryParse('abc', 0), {
            offsetEnd: 1,
            data: 'a',
        });
    }
    {
        const parser = p.any.value('xxx');
        assertExtendType<Parser<'xxx'>, typeof parser>();
        const textParser = parser.text;
        assertExtendType<Parser<string>, typeof textParser>();

        t.deepEqual(textParser.tryParse('abc', 1), {
            offsetEnd: 2,
            data: 'b',
        });
    }
    {
        const parser = p.any.zeroOrMore;
        assertExtendType<Parser<string[]>, typeof parser>();
        const textParser = parser.text;
        assertExtendType<Parser<string>, typeof textParser>();

        t.deepEqual(textParser.tryParse('abc', 0), {
            offsetEnd: 3,
            data: 'abc',
        });
    }
    {
        const parser = p.any.value(42).oneOrMore;
        assertExtendType<Parser<[42, ...42[]]>, typeof parser>();
        const textParser = parser.text;
        assertExtendType<Parser<string>, typeof textParser>();

        t.deepEqual(textParser.tryParse('abc', 0), {
            offsetEnd: 3,
            data: 'abc',
        });
    }
    {
        const parser = p.any.oneOrMore.action(value => ({ value }));
        assertExtendType<
            Parser<{ value: [string, ...string[]] }>,
            typeof parser
        >();
        const textParser = parser.text;
        assertExtendType<Parser<string>, typeof textParser>();

        t.deepEqual(textParser.tryParse('abc', 0), {
            offsetEnd: 3,
            data: 'abc',
        });
    }
});

test('should not match if starting offset is out of range', t => {
    t.is(p.any.text.tryParse('abc', 99), undefined);
});

test.skip('should not invoke action callback', t => {
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
    t.deepEqual(parser.text.tryParse('abc', 0), {
        offsetEnd: 3,
        data: 'abc',
    });

    assertCallAction = () =>
        t.pass('should invoke action callback if not yet invoked the action');
    assertCount++;
    t.deepEqual(parser.tryParse('abc', 0), {
        offsetEnd: 3,
        data: [{ char: 'a' }, { char: 'b' }, { char: 'c' }],
    });

    assertCallAction = () =>
        t.fail(
            'should not invoke action callback if the action has already been invoked',
        );
    assertCount++;
    t.deepEqual(parser.tryParse('abc', 0), {
        offsetEnd: 3,
        data: [{ char: 'a' }, { char: 'b' }, { char: 'c' }],
    });

    t.plan(assertCount + 2);
    t.deepEqual(
        p.any.zeroOrMore.text
            .action(text => {
                t.pass(
                    'should invoke action callback if the result of action is needed',
                );
                return { text };
            })
            .tryParse('abc', 0),
        {
            offsetEnd: 3,
            data: { text: 'abc' },
        },
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

    assertType<TypeEq<typeof opt1α1, Parser<string>>>();
    assertType<TypeEq<typeof opt1α2, Parser<string>>>();
    assertType<TypeEq<typeof opt1β1, Parser<string>>>();
    assertType<TypeEq<typeof opt1β2, Parser<string>>>();
    assertType<TypeEq<typeof opt2α1, Parser<string>>>();
    assertType<TypeEq<typeof opt2α2, Parser<string>>>();
});
