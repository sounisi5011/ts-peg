// JSON Grammar
// ============
//
// See: https://tools.ietf.org/html/rfc8259

import p, { Parser } from '../src';
import { DIGIT, HEXDIG } from './rfc5234-abnf.grammar';

/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/no-use-before-define */

// ----- 2. JSON Grammar -----
// See: https://tools.ietf.org/html/rfc8259#section-2

const JSON_text = p.seq(() => [ws, value, ws]).action(([, value]) => value);

const begin_array = p.seq(() => [ws, '\x5B', ws]); // [ left square bracket
const begin_object = p.seq(() => [ws, '\x7B', ws]); // { left curly bracket
const end_array = p.seq(() => [ws, '\x5D', ws]); // ] right square bracket
const end_object = p.seq(() => [ws, '\x7D', ws]); // } right curly bracket
const name_separator = p.seq(() => [ws, '\x3A', ws]); // : colon
const value_separator = p.seq(() => [ws, '\x2C', ws]); // , comma

const ws = p.or(
    '\x20', // Space
    '\x09', // Horizontal tab
    '\x0A', // Line feed or New line
    '\x0D', // Carriage return
).zeroOrMore;

// ----- 3. Values -----
// See: https://tools.ietf.org/html/rfc8259#section-3

type JSONValue = boolean | null | JSONObject | JSONValue[] | number | string;
type JSONObject = { [property: string]: JSONValue };

const value: Parser<JSONValue> = p.or(() => [
    false_,
    null_,
    true_,
    object,
    array,
    number,
    string,
]);
const false_ = p.str('\x66\x61\x6c\x73\x65').action(() => false); // false
const null_ = p.str('\x6e\x75\x6c\x6c').action(() => null); // null
const true_ = p.str('\x74\x72\x75\x65').action(() => true); // true

// ----- 4. Objects -----
// See: https://tools.ietf.org/html/rfc8259#section-4

const object = p
    .seq(() => [
        begin_object,
        p
            .seq(
                member,
                p.seq(value_separator, member).action(([, member]) => member)
                    .zeroOrMore,
            )
            .action(([head, tail]) =>
                [head, ...tail].reduce<JSONObject>(
                    (obj, { name, value }) => ({ ...obj, [name]: value }),
                    {},
                ),
            ).optional,
        end_object,
    ])
    .action(([, members]) => members ?? {});
const member = p
    .seq(() => [string, name_separator, value])
    .action(([name, , value]) => ({ name, value }));

// ----- 5. Arrays -----
// See: https://tools.ietf.org/html/rfc8259#section-5

const array = p
    .seq(
        begin_array,
        p
            .seq(
                value,
                p.seq(value_separator, value).action(([, value]) => value)
                    .zeroOrMore,
            )
            .action(([head, tail]) => [head].concat(tail)).optional,
        end_array,
    )
    .action(([, values]) => values ?? []);

// ----- 6. Numbers -----
// See: https://tools.ietf.org/html/rfc8259#section-6

const number = p
    .seq(() => [minus.optional, int, frac.optional, exp.optional])
    .action((_, { text }) => parseFloat(text));
const decimal_point = p.str('\x2E'); // .
const digit1_9 = p.chars('\x31-\x39'); // 1-9
const e = p.or('\x65', '\x45'); // e E
const exp = p.seq(() => [e, p.or(minus, plus).optional, DIGIT.oneOrMore]);
const frac = p.seq(() => [decimal_point, DIGIT.oneOrMore]);
const int = p.or(() => [zero, p.seq(digit1_9, DIGIT.zeroOrMore)]);
const minus = p.str('\x2D'); // -
const plus = p.str('\x2B'); // +
const zero = p.str('\x30'); // 0

// ----- 7. Strings -----
// See: https://tools.ietf.org/html/rfc8259#section-7

const string = p
    .seq(() => [quotation_mark, char.zeroOrMore, quotation_mark])
    .action(([, chars]) => chars.join(''));
const char = p.or(() => [
    unescaped,
    p
        .seq(
            escape,
            p.or(
                '\x22', // "    quotation mark  U+0022
                '\x5C', // \    reverse solidus U+005C
                '\x2F', // /    solidus         U+002F
                p.str('\x62').action(() => `\u0008`), // b    backspace       U+0008
                p.str('\x66').action(() => `\u000C`), // f    form feed       U+000C
                p.str('\x6E').action(() => `\u000A`), // n    line feed       U+000A
                p.str('\x72').action(() => `\u000D`), // r    carriage return U+000D
                p.str('\x74').action(() => '\u0009'), // t    tab             U+0009
                p
                    .seq('\x75', HEXDIG.times(4)) // uXXXX                U+XXXX
                    .action(([, digits]) =>
                        String.fromCharCode(parseInt(digits.join(''), 16)),
                    ),
            ),
        )
        .action(([, sequence]) => sequence),
]);
const escape = p.str('\x5C'); // \
const quotation_mark = p.str('\x22'); // "
const unescaped = p.chars('\x20-\x21\x23-\x5B\x5D-\u{10FFFF}');

export default JSON_text;
