import { assertType, TypeEq } from 'typepark';

import p, { Parser } from '../../src';

{
    const parser = p.str('1').zeroOrMore;
    assertType<TypeEq<typeof parser, Parser<'1'[]>>>();
}
{
    const parser = p.seq('x', 'y', p.any).zeroOrMore;
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string][]>>>();
}
{
    const parser = p.chars('0-9').zeroOrMore;
    assertType<TypeEq<typeof parser, Parser<string[]>>>();
}

{
    const parser = p.str('1').oneOrMore;
    assertType<TypeEq<typeof parser, Parser<['1', ...'1'[]]>>>();
}
{
    const parser = p.seq('x', 'y', p.any).oneOrMore;
    assertType<
        TypeEq<
            typeof parser,
            Parser<[['x', 'y', string], ...['x', 'y', string][]]>
        >
    >();
}
{
    const parser = p.chars('0-9').oneOrMore;
    assertType<TypeEq<typeof parser, Parser<[string, ...string[]]>>>();
}

{
    const parser = p.str('1').optional;
    assertType<TypeEq<typeof parser, Parser<'1' | undefined>>>();
}
{
    const parser = p.seq('x', 'y', p.any).optional;
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string] | undefined>>>();
}
{
    const parser = p.chars('0-9').optional;
    assertType<TypeEq<typeof parser, Parser<string | undefined>>>();
}

{
    const parser = p.any.times(0);
    assertType<TypeEq<typeof parser, Parser<[]>>>();
}
{
    const parser = p.any.times(1);
    assertType<TypeEq<typeof parser, Parser<[string]>>>();
}
{
    const parser = p.str('x').times(2);
    assertType<TypeEq<typeof parser, Parser<['x', 'x']>>>();
}
{
    const parser = p.str('8').times(4);
    assertType<TypeEq<typeof parser, Parser<['8', '8', '8', '8']>>>();
}
{
    const parser = p.seq('0', '1').times(8);
    assertType<
        TypeEq<
            typeof parser,
            Parser<
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
        >
    >();
}
