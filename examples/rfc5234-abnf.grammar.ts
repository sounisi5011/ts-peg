// ABNF Grammar
// ============
//
// See: https://tools.ietf.org/html/rfc5234

import p, { CustomizableParser } from '../src';

/* eslint-disable @typescript-eslint/no-use-before-define */

function usAsciiCaseInsensitive(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x01-\x7F]+/g, chars => chars.toLowerCase());
}

/**
 * ABNF strings are case insensitive and the character set for these strings is US-ASCII.
 * @see https://tools.ietf.org/html/rfc5234#section-2.3
 */
function abnfStr(str: string): CustomizableParser<string> {
    const istr = usAsciiCaseInsensitive(str);
    return new CustomizableParser((input, offsetStart) => {
        const offsetEnd = offsetStart + str.length;
        const inputStr = input.substring(offsetStart, offsetEnd);
        return usAsciiCaseInsensitive(inputStr) === istr
            ? { offsetEnd, valueGetter: () => str }
            : undefined;
    }, p);
}

// ----- B.1. Core Rules -----
// See: https://tools.ietf.org/html/rfc5234#appendix-B.1

export const ALPHA = p.chars('\x41-\x5A\x61-\x7A'); // A-Z / a-z
export const BIT = p.or(abnfStr('0'), abnfStr('1'));
export const CHAR = p.chars('\x01-\x7F'); // any 7-bit US-ASCII character, excluding NUL
export const CR = p.str('\x0D'); // carriage return
export const CRLF = p.seq(() => [CR, LF]); // Internet standard newline
export const CTL = p.chars('\x00-\x1F\x7F'); // controls
export const DIGIT = p.chars('\x30-\x39'); // 0-9
export const DQUOTE = p.str('\x22'); // " (Double Quote)
export const HEXDIG = p.or(
    DIGIT,
    ...['A', 'B', 'C', 'D', 'E', 'F'].map(abnfStr),
);
export const HTAB = p.str('\x09'); // horizontal tab
export const LF = p.str('\x0A'); // linefeed
export const LWSP = p.zeroOrMore(() => [p.or(WSP, p.seq(CRLF, WSP))]);
// Use of this linear-white-space rule
// permits lines containing only white
// space that are no longer legal in
// mail headers and have caused
// interoperability problems in other
// contexts.
// Do not use when defining mail
// headers and use with caution in
// other contexts.
export const OCTET = p.chars('\x00-\xFF'); // 8 bits of data
export const SP = p.str('\x20');
export const VCHAR = p.chars('\x21-\x7E'); // visible (printing) characters
export const WSP = p.or(SP, HTAB); // white space
