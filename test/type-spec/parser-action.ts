import { assertType, TypeEq } from 'typepark';

import p, { ParserResultDataType } from '../../src';

p.seq('1').action(exps => {
    assertType<TypeEq<typeof exps, ['1']>>();
});
p.seq(p.chars('A-Z'), '-', p.chars('0-9')).action(exps => {
    assertType<TypeEq<typeof exps, [string, '-', string]>>();
});
{
    const parser = p.seq('1').action(([num]) => Number(num));
    assertType<TypeEq<number, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq('1').action(([num]) => [Number(num)]);
    assertType<TypeEq<[number], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq('1').action(([num]) => [Number(num)] as const);
    assertType<
        TypeEq<readonly [number], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p
        .seq('1')
        .action(([num]) => [Number(num), Number(num) ** 2]);
    assertType<TypeEq<[number, number], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq('1', '2', '3').action(nums => [nums[0], nums[2]]);
    assertType<TypeEq<['1', '3'], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p
        .seq('1', '2', '3')
        .action(nums => [nums[0], nums[2]] as const);
    assertType<
        TypeEq<readonly ['1', '3'], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.seq('1', '2', '3').action(nums => nums.map(Number));
    assertType<TypeEq<number[], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('null').action(() => null);
    assertType<TypeEq<null, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('void').action(() => undefined);
    assertType<TypeEq<undefined, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('true').action(() => true);
    assertType<TypeEq<boolean, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('true').action(() => true as const);
    assertType<TypeEq<true, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('false').action(() => false);
    assertType<TypeEq<boolean, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('false').action(() => false as const);
    assertType<TypeEq<false, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('-1').action(() => -1);
    assertType<TypeEq<number, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('-1').action(() => -1 as const);
    assertType<TypeEq<-1, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('0').action(() => 0);
    assertType<TypeEq<number, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('0').action(() => 0 as const);
    assertType<TypeEq<0, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('1').action(() => 1);
    assertType<TypeEq<number, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('1').action(() => 1 as const);
    assertType<TypeEq<1, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('a').action(() => 'a');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('a').action(() => 'a' as const);
    assertType<TypeEq<'a', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('f').action(() => 'foo');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('f').action(() => 'foo' as const);
    assertType<TypeEq<'foo', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str('@@iterator').action(() => Symbol.iterator);
    assertType<TypeEq<symbol, ParserResultDataType<typeof parser>>>();
}
