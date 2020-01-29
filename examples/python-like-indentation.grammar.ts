// Off-side rule Grammar
// =====================
//
// See: https://stackoverflow.com/a/11700527/4907315

import p, { Parser } from '../src';

const indentStack: string[] = [];
let currentIndent = '';

export type Line = Record<string, Line[] | undefined> | string;

/* eslint-disable @typescript-eslint/no-use-before-define */

const _init = p.str('').action(() => {
    indentStack.length = 0;
    currentIndent = '';
});

export const start = p
    .seq(() => [_init, INDENT.optional, line])
    .action(([, , l]) => l);

export const line: Parser<Line> = p
    .seq(() => [
        SAMEDENT,
        p.seq(p.not_a(EOL), p.any).oneOrMore.text,
        EOL.optional,
        p.seq(INDENT, line.zeroOrMore, DEDENT).action(([, c]) => c).optional,
    ])
    .action(([, line, , children]) => {
        const o: Extract<Line, object> = {};
        o[line] = children;
        return children ? o : line;
    });

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
        // Note: No action is taken unless the matching result data is read.
        //       Therefore, the action at this position is never invoked.
        //       To work around this problem, use the exp.match() method instead of the exp.action() method.
        .match(indent => {
            indentStack.push(currentIndent);
            currentIndent = indent;
            return true;
        }),
);

export const DEDENT = p.str('').action(() => {
    currentIndent = indentStack.pop() ?? '';
});

export default start;
