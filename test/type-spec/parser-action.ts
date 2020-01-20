import { assertType, TypeEq } from 'typepark';

import p, { Parser } from '../../src';

p.seq('1').action(exps => {
    assertType<TypeEq<typeof exps, ['1']>>();
});
p.seq(p.chars('A-Z'), '-', p.chars('0-9')).action(exps => {
    assertType<TypeEq<typeof exps, [string, '-', string]>>();
});
{
    const parser = p.seq('1').action(([num]) => Number(num));
    assertType<TypeEq<typeof parser, Parser<number>>>();
}
{
    const parser = p.seq('1').action(([num]) => [Number(num)]);
    assertType<TypeEq<typeof parser, Parser<[number]>>>();
}
{
    const parser = p.seq('1').action(([num]) => [Number(num)] as const);
    assertType<TypeEq<typeof parser, Parser<readonly [number]>>>();
}
{
    const parser = p
        .seq('1')
        .action(([num]) => [Number(num), Number(num) ** 2]);
    assertType<TypeEq<typeof parser, Parser<[number, number]>>>();
}
{
    const parser = p.seq('1', '2', '3').action(nums => [nums[0], nums[2]]);
    assertType<TypeEq<typeof parser, Parser<['1', '3']>>>();
}
{
    const parser = p
        .seq('1', '2', '3')
        .action(nums => [nums[0], nums[2]] as const);
    assertType<TypeEq<typeof parser, Parser<readonly ['1', '3']>>>();
}
{
    const parser = p.seq('1', '2', '3').action(nums => nums.map(Number));
    assertType<TypeEq<typeof parser, Parser<number[]>>>();
}
{
    const parser = p.str('null').action(() => null);
    assertType<TypeEq<typeof parser, Parser<null>>>();
}
{
    const parser = p.str('void').action(() => undefined);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.str('true').action(() => true);
    assertType<TypeEq<typeof parser, Parser<boolean>>>();
}
{
    const parser = p.str('true').action(() => true as const);
    assertType<TypeEq<typeof parser, Parser<true>>>();
}
{
    const parser = p.str('false').action(() => false);
    assertType<TypeEq<typeof parser, Parser<boolean>>>();
}
{
    const parser = p.str('false').action(() => false as const);
    assertType<TypeEq<typeof parser, Parser<false>>>();
}
{
    const parser = p.str('-1').action(() => -1);
    assertType<TypeEq<typeof parser, Parser<number>>>();
}
{
    const parser = p.str('-1').action(() => -1 as const);
    assertType<TypeEq<typeof parser, Parser<-1>>>();
}
{
    const parser = p.str('0').action(() => 0);
    assertType<TypeEq<typeof parser, Parser<number>>>();
}
{
    const parser = p.str('0').action(() => 0 as const);
    assertType<TypeEq<typeof parser, Parser<0>>>();
}
{
    const parser = p.str('1').action(() => 1);
    assertType<TypeEq<typeof parser, Parser<number>>>();
}
{
    const parser = p.str('1').action(() => 1 as const);
    assertType<TypeEq<typeof parser, Parser<1>>>();
}
{
    const parser = p.str('a').action(() => 'a');
    assertType<TypeEq<typeof parser, Parser<string>>>();
}
{
    const parser = p.str('a').action(() => 'a' as const);
    assertType<TypeEq<typeof parser, Parser<'a'>>>();
}
{
    const parser = p.str('f').action(() => 'foo');
    assertType<TypeEq<typeof parser, Parser<string>>>();
}
{
    const parser = p.str('f').action(() => 'foo' as const);
    assertType<TypeEq<typeof parser, Parser<'foo'>>>();
}
{
    const parser = p.str('@@iterator').action(() => Symbol.iterator);
    assertType<TypeEq<typeof parser, Parser<symbol>>>();
}
