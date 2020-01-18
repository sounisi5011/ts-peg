import { assertType, TypeEq } from 'typepark';

import p, { Parser } from '../../src';

p.seq('1').action(exps => {
    assertType<TypeEq<typeof exps, ['1']>>();
});
p.seq(p.range('A', 'Z'), '-', p.range('0', '9')).action(exps => {
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
