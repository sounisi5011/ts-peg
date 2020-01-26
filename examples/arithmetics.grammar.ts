// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

import p, { Parser } from '../src';

/* eslint-disable @typescript-eslint/no-use-before-define */

// Expression <- Term (ws ('+' / '-') ws Term)*
export const Expression: Parser<number> = p
    .seq(() => [
        Term,
        p
            .seq(ws, p.or('+', '-'), ws, Term)
            .action(([, operator, , factor]) => [operator, factor]).zeroOrMore,
    ])
    .action(([head, tail]) =>
        tail.reduce(
            (result, [operator, factor]) =>
                operator === '+' ? result + factor : result - factor,
            head,
        ),
    );

// Term       <- Factor (ws ('*' / '/') ws Factor)*
export const Term = p
    .seq(() => [
        Factor,
        p
            .seq(ws, p.or('*', '/'), ws, Factor)
            .action(([, operator, , factor]) => [operator, factor]).zeroOrMore,
    ])
    .action(([head, tail]) =>
        tail.reduce(
            (result, [operator, factor]) =>
                operator === '*' ? result * factor : result / factor,
            head,
        ),
    );

// Factor     <- '(' ws Expression ws ')'
//             / Integer
export const Factor = p.or(() => [
    p.seq('(', ws, Expression, ws, ')').action(([, , exp]) => exp),
    Integer,
]);

// Integer    <- ws [0-9]+
export const Integer = p
    .seq(() => [ws, p.chars('0-9').oneOrMore])
    .action((_, { text }) => parseInt(text, 10));

// ws         <- [ \t\n\r]*
export const ws = p.chars(' \t\n\r').zeroOrMore;

export default Expression;
