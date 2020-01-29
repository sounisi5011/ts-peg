// Off-side rule Grammar
// =====================
//
// See: https://stackoverflow.com/a/11700527/4907315

import p, { Parser } from '../src';

const indentStack: string[] = [];
let currentIndent = '';

export type Line = string | Line[];

/* eslint-disable @typescript-eslint/no-use-before-define */

const _init = p.str('').action(() => {
    indentStack.length = 0;
    currentIndent = '';
});

export const start = p
    .seq(() => [_init, INDENT.optional, line.zeroOrMore])
    .action(([, , l]) => l);

export const line: Parser<Line> = p
    .seq(() => [
        p.or(
            p.seq(INDENT, line.zeroOrMore, DEDENT).action(([, lines]) => lines),
            p
                .seq(SAMEDENT, p.seq(p.not_a(EOL), p.any).oneOrMore.text)
                .action(([, label]) => label),
        ),
        EOL.optional,
    ])
    .action(([list]) => list);

export const EOL = p.or('\r\n', '\n', '\r');

export const SAMEDENT = p
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
