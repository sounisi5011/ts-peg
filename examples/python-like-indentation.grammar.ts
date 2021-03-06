// Off-side rule Grammar
// =====================
//
// See: https://stackoverflow.com/a/11700527/4907315

import p, { Parser } from '../src';

const indentStack: string[] = [];
let currentIndent = '';

export interface Statement {
    name: string;
    children: Statement[];
}

/* eslint-disable @typescript-eslint/no-use-before-define */

const _init = p.str('').action(() => {
    indentStack.length = 0;
    currentIndent = '';
});

export const start = p
    .seq(() => [_init, INDENT.optional, stmt.zeroOrMore])
    .action(([, , l]) => l);

export const stmt: Parser<Statement> = p
    .seq(() => [
        SAMEDENT,
        p.seq(p.not_a(EOL), p.any).oneOrMore.text,
        EOL.optional,
        p.seq(INDENT, stmt.zeroOrMore, DEDENT).action(([, c]) => c).optional,
        EOL.optional,
    ])
    .action(([, name, , children]) => ({
        name,
        children: children ?? [],
    }));

export const EOL = p.or('\r\n', '\n', '\r');

export const SAMEDENT: Parser<string> = p
    .chars(' \t')
    .zeroOrMore.text.match(indent => indent === currentIndent);

export const INDENT = p.is_a(
    p
        .chars(' \t')
        .oneOrMore.text.match(
            indent =>
                indent.startsWith(currentIndent) &&
                indent.length > currentIndent.length,
        )
        .action(indent => {
            indentStack.push(currentIndent);
            currentIndent = indent;
        }),
);

export const DEDENT = p.str('').action(() => {
    currentIndent = indentStack.pop() ?? '';
});

export default start;
