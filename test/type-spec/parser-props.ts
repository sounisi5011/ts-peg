import { assertType, TypeEq } from 'typepark';

import p, { Parser } from '../../src';

// exp.zeroOrMore
{
    const parser = p.str('1').zeroOrMore;
    assertType<TypeEq<typeof parser, Parser<[...'1'[]]>>>();
}
{
    const parser = p.seq('x', 'y', p.any).zeroOrMore;
    assertType<TypeEq<typeof parser, Parser<[...['x', 'y', string][]]>>>();
}
{
    const parser = p.chars('0-9').zeroOrMore;
    assertType<TypeEq<typeof parser, Parser<[...string[]]>>>();
}

// exp.oneOrMore
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

// exp.optional
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

// exp.times()
{
    const parser = p.any.times(0);
    assertType<TypeEq<typeof parser, Parser<[]>>>();
}
{
    const parser = p.any.times(1);
    assertType<TypeEq<typeof parser, Parser<[string]>>>();
}
{
    const parser = p.any.times([].length);
    assertType<TypeEq<typeof parser, Parser<[...string[]]>>>();
}
{
    const parser = p.any.times(NaN);
    assertType<TypeEq<typeof parser, Parser<[...string[]]>>>();
}
{
    const parser = p.any.times(Infinity);
    assertType<TypeEq<typeof parser, Parser<[...string[]]>>>();
}
{
    const parser = p.str('x').times(2);
    assertType<TypeEq<typeof parser, Parser<['x', 'x']>>>();
}
{
    const parser = p.str('x').times(Math.PI);
    assertType<TypeEq<typeof parser, Parser<[...'x'[]]>>>();
}
{
    const parser = p.str('x').times(NaN);
    assertType<TypeEq<typeof parser, Parser<[...'x'[]]>>>();
}
{
    const parser = p.str('x').times(Infinity);
    assertType<TypeEq<typeof parser, Parser<[...'x'[]]>>>();
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
{
    const parser = p.seq('0', '1').times(process.pid);
    assertType<TypeEq<typeof parser, Parser<[...['0', '1'][]]>>>();
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
