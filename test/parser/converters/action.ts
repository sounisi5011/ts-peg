import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, {
    ActionExecutionEnvironment,
    Parser,
    ParseResult,
    ParserGenerator,
    ParserResultDataType,
    ParseSuccessResult,
} from '../../../src';
import { parse } from '../../helpers/parser';

test('should convert result value', t => {
    const exp1 = p.any.action(char => char.length);
    const exp2 = p.any.action(char => char.length).oneOrMore;
    const exp3 = p.any.zeroOrMore.action(chars =>
        chars.map(char => ({ char, code: char.codePointAt(0) })),
    );

    t.is(parse(exp1, 'abc')?.data, 1);
    t.deepEqual(parse(exp2, 'abc')?.data, [1, 1, 1]);
    t.deepEqual(parse(exp3, '🐉💭😋🏡')?.data, [
        { char: '🐉', code: 0x1f409 },
        { char: '💭', code: 0x1f4ad },
        { char: '😋', code: 0x1f60b },
        { char: '🏡', code: 0x1f3e1 },
    ]);

    assertType<TypeEq<number, ParserResultDataType<typeof exp1>>>();
    assertType<
        TypeEq<[number, ...number[]], ParserResultDataType<typeof exp2>>
    >();
    assertType<
        TypeEq<
            { char: string; code: number | undefined }[],
            ParserResultDataType<typeof exp3>
        >
    >();
});

function readData(value: ParseResult<unknown>[]): unknown {
    return value.forEach(value => {
        if (value instanceof ParseSuccessResult) {
            return value.data;
        }
    });
}

test('validate action arguments', t => {
    readData([
        p.any
            .action((...args) => {
                t.is(args[0], 'a');
                assertType<
                    TypeEq<typeof args, [string, ActionExecutionEnvironment]>
                >();
            })
            .tryParse('abc', 0, Infinity),
        p
            .str('a')
            .action((...args) => {
                t.is(args[0], 'a');
                assertType<
                    TypeEq<typeof args, ['a', ActionExecutionEnvironment]>
                >();
            })
            .tryParse('abc', 0, Infinity),

        p.any.zeroOrMore
            .action((...args) => {
                t.deepEqual(args[0], ['a', 'b', 'c']);
                assertType<
                    TypeEq<typeof args, [string[], ActionExecutionEnvironment]>
                >();
            })
            .tryParse('abc', 0, Infinity),
        p.any.oneOrMore
            .action((...args) => {
                t.deepEqual(args[0], ['a', 'b', 'c']);
                assertType<
                    TypeEq<
                        typeof args,
                        [[string, ...string[]], ActionExecutionEnvironment]
                    >
                >();
            })
            .tryParse('abc', 0, Infinity),
        p.any.optional
            .action((...args) => {
                t.deepEqual(args[0], 'a');
                assertType<
                    TypeEq<
                        typeof args,
                        [string | undefined, ActionExecutionEnvironment]
                    >
                >();
            })
            .tryParse('abc', 0, Infinity),

        p
            .str('x')
            .zeroOrMore.action((...args) => {
                t.deepEqual(args[0], []);
                assertType<
                    TypeEq<typeof args, ['x'[], ActionExecutionEnvironment]>
                >();
            })
            .tryParse('abc', 0, Infinity),
        p
            .str('x')
            .optional.action((...args) => {
                t.deepEqual(args[0], undefined);
                assertType<
                    TypeEq<
                        typeof args,
                        ['x' | undefined, ActionExecutionEnvironment]
                    >
                >();
            })
            .tryParse('abc', 0, Infinity),
    ]);
});

test('should not call action callback', t => {
    p.any.action(() => t.fail()).zeroOrMore.tryParse('', 0, Infinity);
    p.any.action(() => t.fail()).zeroOrMore.tryParse('abc', 99, Infinity);
    p.str('x')
        .action(() => t.fail())
        .zeroOrMore.tryParse('abc', 0, Infinity);
    p.any.oneOrMore.action(() => t.fail()).tryParse('', 0, Infinity);
    p.any.oneOrMore.action(() => t.fail()).tryParse('abc', 99, Infinity);
    p.str('x')
        .oneOrMore.action(() => t.fail())
        .tryParse('abc', 0, Infinity);
    t.pass();
});

test('should always invoke the action callback', t => {
    t.plan(2);
    const action = p.any.action(() => t.pass());
    const parser = p.seq(p.is_a(action), action);
    parser.tryParse('a', 0, Infinity);
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const fnB = (): boolean => true;
    const fnN = (): number => 42;
    const parser1 = p.str('foo');
    const parser2 = new ParserGenerator().str('foo');
    const action1B1 = parser1.action(fnB);
    const action1B2 = parser1.action(fnB);
    const action1N1 = parser1.action(fnN);
    const action1N2 = parser1.action(fnN);
    const action2B1 = parser2.action(fnB);
    const action2B2 = parser2.action(fnB);

    t.is(action1B1, action1B2);
    t.is(action1N1, action1N2);
    t.is(action2B1, action2B2);

    t.not<Parser<boolean | number>>(action1B1, action1N1);
    t.not(
        action1B1,
        action2B1,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not<Parser<boolean | number>>(action1N1, action2B1);

    assertType<TypeEq<boolean, ParserResultDataType<typeof action1B1>>>();
    assertType<TypeEq<boolean, ParserResultDataType<typeof action1B2>>>();
    assertType<TypeEq<number, ParserResultDataType<typeof action1N1>>>();
    assertType<TypeEq<number, ParserResultDataType<typeof action1N2>>>();
    assertType<TypeEq<boolean, ParserResultDataType<typeof action2B1>>>();
    assertType<TypeEq<boolean, ParserResultDataType<typeof action2B2>>>();
});
