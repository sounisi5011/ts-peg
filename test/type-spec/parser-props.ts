import { assertType, TypeEq } from 'typepark';

import p, { ParserResultDataType } from '../../src';

// exp.zeroOrMore
{
    const parser = p.str('1').zeroOrMore;
    assertType<TypeEq<[...'1'[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq('x', 'y', p.any).zeroOrMore;
    assertType<
        TypeEq<[...['x', 'y', string][]], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.chars('0-9').zeroOrMore;
    assertType<TypeEq<[...string[]], ParserResultDataType<typeof parser>>>();
}

// exp.oneOrMore
{
    const parser = p.str('1').oneOrMore;
    assertType<TypeEq<['1', ...'1'[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq('x', 'y', p.any).oneOrMore;
    assertType<
        TypeEq<
            [['x', 'y', string], ...['x', 'y', string][]],
            ParserResultDataType<typeof parser>
        >
    >();
}
{
    const parser = p.chars('0-9').oneOrMore;
    assertType<
        TypeEq<[string, ...string[]], ParserResultDataType<typeof parser>>
    >();
}

// exp.optional
{
    const parser = p.str('1').optional;
    assertType<TypeEq<'1' | undefined, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq('x', 'y', p.any).optional;
    assertType<
        TypeEq<
            ['x', 'y', string] | undefined,
            ParserResultDataType<typeof parser>
        >
    >();
}
{
    const parser = p.chars('0-9').optional;
    assertType<
        TypeEq<string | undefined, ParserResultDataType<typeof parser>>
    >();
}

// exp.times()
{
    const parser = p.any.times(0);
    assertType<TypeEq<[], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.any.times(1);
    assertType<TypeEq<[string], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.any.times([].length);
    assertType<TypeEq<[...string[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.any.times(NaN);
    assertType<TypeEq<[...string[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.any.times(Infinity);
    assertType<TypeEq<[...string[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('x').times(2);
    assertType<TypeEq<['x', 'x'], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('x').times(Math.PI);
    assertType<TypeEq<[...'x'[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('x').times(NaN);
    assertType<TypeEq<[...'x'[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('x').times(Infinity);
    assertType<TypeEq<[...'x'[]], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('8').times(4);
    assertType<
        TypeEq<['8', '8', '8', '8'], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.seq('0', '1').times(8);
    assertType<
        TypeEq<
            [
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
                ['0', '1'],
            ],
            ParserResultDataType<typeof parser>
        >
    >();
}
{
    const parser = p.seq('0', '1').times(process.pid);
    assertType<
        TypeEq<[...['0', '1'][]], ParserResultDataType<typeof parser>>
    >();
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
