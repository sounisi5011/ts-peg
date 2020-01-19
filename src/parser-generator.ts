import Parser, { ParseFunc, ParserResult } from './parser';
import CharacterClassParser from './parser/character-class';
import {
    isReadonlyOrWritableArray,
    OneOrMoreReadonlyTuple,
    OneOrMoreTuple,
} from './types';

type ParserLike = Parser<unknown> | string;

type ParserLike2Result<T extends ParserLike> = T extends Parser<unknown>
    ? ParserResult<T>
    : T;
type ParserTuple2ResultTuple<T extends readonly ParserLike[]> = {
    -readonly [P in keyof T]: T[P] extends ParserLike
        ? ParserLike2Result<T[P]>
        : T[P];
};

interface StringParserCacheMap extends Map<string, Parser<string>> {
    get<T>(key: T): Parser<T> | undefined;
    set<T>(key: T, value: Parser<T>): this;
}

export default class ParserGenerator {
    private __anyCache?: Parser<string>;
    get any(): Parser<string> {
        if (this.__anyCache) return this.__anyCache;
        return (this.__anyCache = new Parser((input, offsetStart) => {
            // Note: Use a string iterator to retrieve Unicode surrogate pair one character (eg, emoji, old kanji, etc.).
            for (const char of input.substring(offsetStart, offsetStart + 2)) {
                return { offsetEnd: offsetStart + char.length, data: char };
            }
            return undefined;
        }));
    }

    private readonly __strParserCacheMap: StringParserCacheMap = new Map();
    str<T extends string>(str: T): Parser<T> {
        let cachedParser = this.__strParserCacheMap.get(str);
        if (cachedParser) return cachedParser;

        cachedParser = new Parser((input, offsetStart) =>
            input.startsWith(str, offsetStart)
                ? { offsetEnd: offsetStart + str.length, data: str }
                : undefined,
        );
        this.__strParserCacheMap.set(str, cachedParser);
        return cachedParser;
    }

    range(str1: string, str2: string): Parser<string> {
        const codePoint1 = str1.codePointAt(0);
        if (typeof codePoint1 !== 'number') {
            throw new TypeError(
                'first argument must be a single character string value',
            );
        }
        const codePoint2 = str2.codePointAt(0);
        if (typeof codePoint2 !== 'number') {
            throw new TypeError(
                'first argument must be a single character string value',
            );
        }
        const minCodePoint = Math.min(codePoint1, codePoint2);
        const maxCodePoint = Math.max(codePoint1, codePoint2);

        return new Parser((input, offsetStart) => {
            const currentCodePoint = input.codePointAt(offsetStart);
            if (
                typeof currentCodePoint === 'number' &&
                minCodePoint <= currentCodePoint &&
                currentCodePoint <= maxCodePoint
            ) {
                const currentChar = String.fromCodePoint(currentCodePoint);
                return {
                    offsetEnd: offsetStart + currentChar.length,
                    data: currentChar,
                };
            }
            return undefined;
        });
    }

    chars(chars: string): CharacterClassParser {
        return new CharacterClassParser(chars, this);
    }

    zeroOrMore<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T>[]> {
        return this.seq(...args).zeroOrMore;
    }

    oneOrMore<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<OneOrMoreTuple<ParserTuple2ResultTuple<T>>> {
        return this.seq(...args).oneOrMore;
    }

    optional<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T> | undefined> {
        return this.seq(...args).optional;
    }

    followedBy<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<undefined> {
        const exp = this.seq(...args);
        return new Parser((input, offsetStart) =>
            exp.tryParse(input, offsetStart)
                ? { offsetEnd: offsetStart, data: undefined }
                : undefined,
        );
    }

    notFollowedBy<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<undefined> {
        const exp = this.seq(...args);
        return new Parser((input, offsetStart) =>
            exp.tryParse(input, offsetStart)
                ? undefined
                : { offsetEnd: offsetStart, data: undefined },
        );
    }

    seq<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T>> {
        return this.__validateSequenceArgs(args, (exps, input, offsetStart) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore - Type 'never[]' is not assignable to type 'ParserTuple2ResultTuple<T>'.
            const data: ParserTuple2ResultTuple<T> = [];
            let offset = offsetStart;
            for (const exp of exps as readonly T[number][]) {
                const expParser: Parser<ParserLike2Result<
                    T[number]
                >> = this.__toParser(exp);
                const result = expParser.tryParse(input, offset);
                if (!result) return undefined;
                const expData: ParserLike2Result<T[number]> = result.data;
                data.push(expData);
                offset = result.offsetEnd;
            }
            return { offsetEnd: offset, data };
        });
    }

    or<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserLike2Result<T[number]>> {
        return this.__validateSequenceArgs(args, (exps, input, offsetStart) => {
            for (const exp of exps as readonly T[number][]) {
                const expParser: Parser<ParserLike2Result<
                    T[number]
                >> = this.__toParser(exp);
                const result = expParser.tryParse(input, offsetStart);
                if (result) {
                    return result;
                }
            }
            return undefined;
        });
    }

    /** @TODO */
    label(_label: string): ParserGenerator {
        return this;
    }

    private __toParser<T>(value: Parser<T>): Parser<T>;
    private __toParser(value: string): Parser<string>;
    private __toParser<T extends ParserLike>(
        value: T,
    ): Parser<ParserLike2Result<T>>;

    private __toParser(value: ParserLike): Parser<unknown> {
        return value instanceof Parser ? value : this.str(value);
    }

    private __assertIsExpsArray(
        value: unknown[],
        errorMessage: string,
    ): asserts value is ParserLike[];

    private __assertIsExpsArray(
        value: readonly unknown[],
        errorMessage: string,
    ): asserts value is readonly ParserLike[];

    private __assertIsExpsArray(
        value: readonly unknown[],
        errorMessage: string,
    ): asserts value is readonly ParserLike[] {
        if (
            !value.every(
                item => typeof item === 'string' || item instanceof Parser,
            )
        ) {
            throw new TypeError(errorMessage);
        }
    }

    private __validateSequenceArgs<
        TExps extends readonly ParserLike[],
        TResult
    >(
        args: TExps | [() => TExps],
        callback: (
            exps: TExps,
            ...args: Parameters<ParseFunc<TResult>>
        ) => ReturnType<ParseFunc<TResult>>,
    ): Parser<TResult> {
        const [firstArg] = args;

        if (typeof firstArg === 'function' && !(firstArg instanceof Parser)) {
            return new Parser((...parseArgs) => {
                const exps = firstArg();
                if (!(Array.isArray as isReadonlyOrWritableArray)(exps)) {
                    throw new TypeError(
                        'The return value of a function argument must be an array',
                    );
                }
                this.__assertIsExpsArray(
                    exps,
                    'The return value array of function argument can only contain string values and Parser objects',
                );
                return callback(exps, ...parseArgs);
            });
        }

        this.__assertIsExpsArray(
            args,
            'Only string values and Parser objects can be specified in the arguments',
        );
        return new Parser((...parseArgs) => callback(args, ...parseArgs));
    }
}
