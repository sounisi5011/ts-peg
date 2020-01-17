// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

import p from '../src';

/* eslint-disable @typescript-eslint/no-use-before-define */

export const Expression = p.seq(
    () => [
        Term,
        p.zeroOrMore(
            [ws, p.or('+', '-'), ws, Term],
            ([, operator, , factor]) => [operator, factor],
        ),
    ],
    ([head, tail]) =>
        tail.reduce((result, [operator, factor]) => {
            if (operator === '+') return result + factor;
            if (operator === '-') return result - factor;
        }, head),
);

export const Term = p.seq(
    () => [
        Factor,
        p.zeroOrMore(
            [ws, p.or('*', '/'), ws, Factor],
            ([, operator, , factor]) => [operator, factor],
        ),
    ],
    ([head, tail]) =>
        tail.reduce((result, [operator, factor]) => {
            if (operator === '*') return result * factor;
            if (operator === '/') return result / factor;
        }, head),
);

export const Factor = p.or(() => [
    p.seq(['(', ws, Expression, ws, ')'], ([, , exp]) => exp),
    Integer,
]);

export const Integer = p.label('integer').seq(
    () => [ws, p.range('0', '9').oneOrMore],
    ({ text }) => parseInt(text, 10),
);

export const ws = p.label('whitespace').or(...' \t\n\r').zeroOrMore;

export default Expression;
