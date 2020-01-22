import { assertType, TypeEq } from 'typepark';

import p, {
    OneOrMoreParser,
    Parser,
    ParserResultDataType,
    TimesParser,
    ZeroOrMoreParser,
} from '../../src';

// exp.zeroOrMore
{
    const parser = p.str('1').zeroOrMore;
    assertType<TypeEq<typeof parser, ZeroOrMoreParser<'1'>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, '1'[]>>();
}
{
    const parser = p.seq('x', 'y', p.any).zeroOrMore;
    assertType<TypeEq<typeof parser, ZeroOrMoreParser<['x', 'y', string]>>>();
    assertType<
        TypeEq<ParserResultDataType<typeof parser>, ['x', 'y', string][]>
    >();
}
{
    const parser = p.chars('0-9').zeroOrMore;
    assertType<TypeEq<typeof parser, ZeroOrMoreParser<string>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, string[]>>();
}

// exp.oneOrMore
{
    const parser = p.str('1').oneOrMore;
    assertType<TypeEq<typeof parser, OneOrMoreParser<'1'>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, ['1', ...'1'[]]>>();
}
{
    const parser = p.seq('x', 'y', p.any).oneOrMore;
    assertType<TypeEq<typeof parser, OneOrMoreParser<['x', 'y', string]>>>();
    assertType<
        TypeEq<
            ParserResultDataType<typeof parser>,
            [['x', 'y', string], ...['x', 'y', string][]]
        >
    >();
}
{
    const parser = p.chars('0-9').oneOrMore;
    assertType<TypeEq<typeof parser, OneOrMoreParser<string>>>();
    assertType<
        TypeEq<ParserResultDataType<typeof parser>, [string, ...string[]]>
    >();
}

// exp.optional
{
    const parser = p.str('1').optional;
    assertType<TypeEq<typeof parser, Parser<'1' | undefined>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, '1' | undefined>>();
}
{
    const parser = p.seq('x', 'y', p.any).optional;
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string] | undefined>>>();
    assertType<
        TypeEq<
            ParserResultDataType<typeof parser>,
            ['x', 'y', string] | undefined
        >
    >();
}
{
    const parser = p.chars('0-9').optional;
    assertType<TypeEq<typeof parser, Parser<string | undefined>>>();
    assertType<
        TypeEq<ParserResultDataType<typeof parser>, string | undefined>
    >();
}

// exp.times()
{
    const parser = p.any.times(0);
    assertType<TypeEq<typeof parser, TimesParser<string, 0>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, []>>();
}
{
    const parser = p.any.times(1);
    assertType<TypeEq<typeof parser, TimesParser<string, 1>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, [string]>>();
}
{
    const parser = p.any.times([].length);
    assertType<TypeEq<typeof parser, TimesParser<string, number>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, [...string[]]>>();
}
{
    const parser = p.any.times(NaN);
    assertType<TypeEq<typeof parser, TimesParser<string, number>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, [...string[]]>>();
}
{
    const parser = p.any.times(Infinity);
    assertType<TypeEq<typeof parser, TimesParser<string, number>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, [...string[]]>>();
}
{
    const parser = p.str('x').times(2);
    assertType<TypeEq<typeof parser, TimesParser<'x', 2>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, ['x', 'x']>>();
}
{
    const parser = p.str('x').times(Math.PI);
    assertType<TypeEq<typeof parser, TimesParser<'x', number>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, 'x'[]>>();
}
{
    const parser = p.str('x').times(NaN);
    assertType<TypeEq<typeof parser, TimesParser<'x', number>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, 'x'[]>>();
}
{
    const parser = p.str('x').times(Infinity);
    assertType<TypeEq<typeof parser, TimesParser<'x', number>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, 'x'[]>>();
}
{
    const parser = p.str('8').times(4);
    assertType<TypeEq<typeof parser, TimesParser<'8', 4>>>();
    assertType<
        TypeEq<ParserResultDataType<typeof parser>, ['8', '8', '8', '8']>
    >();
}
{
    const parser = p.seq('0', '1').times(8);
    assertType<TypeEq<typeof parser, TimesParser<['0', '1'], 8>>>();
    assertType<
        TypeEq<
            ParserResultDataType<typeof parser>,
            [
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
            ]
        >
    >();
}
{
    const parser = p.seq('0', '1').times(process.pid);
    assertType<TypeEq<typeof parser, TimesParser<['0', '1'], number>>>();
    assertType<TypeEq<ParserResultDataType<typeof parser>, ['0', '1'][]>>();
}
{
    function random(): 0 | 1 | 2 {
        const rand = Math.random() * 3;
        if (rand >= 2) {
            return 2;
        } else if (rand >= 1) {
            return 1;
        } else {
            return 0;
        }
    }
    const parser = p.str('x').times(random());
    assertType<TypeEq<typeof parser, TimesParser<'x', 0 | 1 | 2>>>();
    assertType<
        TypeEq<ParserResultDataType<typeof parser>, [] | ['x'] | ['x', 'x']>
    >();
    parser.action(([v1, v2]) => {
        assertType<TypeEq<typeof v1, 'x' | undefined>>();
        assertType<TypeEq<typeof v2, 'x' | undefined>>();
    });
}
{
    function random(): 1 | 2 | 9 {
        const rand = Math.random() * 3;
        if (rand >= 2) {
            return 9;
        } else if (rand >= 1) {
            return 2;
        } else {
            return 1;
        }
    }
    const parser = p.str('x').times(random());
    assertType<TypeEq<typeof parser, TimesParser<'x', 1 | 2 | 9>>>();
    assertType<
        TypeEq<
            ParserResultDataType<typeof parser>,
            ['x'] | ['x', 'x'] | ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
        >
    >();
    parser.action(value => {
        assertType<TypeEq<typeof value[0], 'x'>>();
        assertType<TypeEq<typeof value[1], 'x' | undefined>>();
        if (value.length === 9) {
            assertType<TypeEq<typeof value[2], 'x'>>();
            assertType<TypeEq<typeof value[5], 'x'>>();
            assertType<TypeEq<typeof value[8], 'x'>>();
        }
    });
}
