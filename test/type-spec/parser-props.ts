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
