// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

import p from '../src';

/* eslint-disable @typescript-eslint/no-use-before-define */

export const Expression = p
    .seq(() => [
        Term,
        p
            .seq(ws, p.or('+', '-'), ws, Term)
            .action(([, operator, , factor]) => [operator, factor]).zeroOrMore,
    ])
    .action(([head, tail]) =>
        tail.reduce((result, [operator, factor]) => {
            if (operator === '+') return result + factor;
            if (operator === '-') return result - factor;
        }, head),
    );

export const Term = p
    .seq(() => [
        Factor,
        p
            .seq(ws, p.or('*', '/'), ws, Factor)
            .action(([, operator, , factor]) => [operator, factor]).zeroOrMore,
    ])
    .action(([head, tail]) =>
        tail.reduce((result, [operator, factor]) => {
            if (operator === '*') return result * factor;
            if (operator === '/') return result / factor;
        }, head),
    );

export const Factor = p.or(() => [
    p.seq('(', ws, Expression, ws, ')').action(([, , exp]) => exp),
    Integer,
]);

export const Integer = p
    .label('integer')
    .seq(() => [ws, p.range('0', '9').oneOrMore])
    .action((_, { text }) => parseInt(text, 10));

export const ws = p.label('whitespace').or(...' \t\n\r').zeroOrMore;

export default Expression;