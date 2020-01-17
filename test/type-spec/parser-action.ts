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
