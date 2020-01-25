import {
    AnyCharacterParser,
    CharacterClassParser,
    CustomizableParser,
    CustomizableParserParseFunc,
    LiteralStringParser,
    Parser,
    ParserLike,
    ParserResultDataType,
    SequenceParser,
} from './internal';
import {
    isReadonlyOrWritableArray,
    OneOrMoreReadonlyTuple,
    OneOrMoreTuple,
} from './types';

type ParserLike2Result<T extends ParserLike> = T extends Parser<unknown>
    ? ParserResultDataType<T>
    : T;
type ParserTuple2ResultTuple<T extends readonly ParserLike[]> = {
    -readonly [P in keyof T]: T[P] extends ParserLike
        ? ParserLike2Result<T[P]>
        : T[P];
};

export class ParserGenerator {
    get any(): AnyCharacterParser {
        return new AnyCharacterParser(this);
    }

    str<T extends string>(str: T): LiteralStringParser<T> {
        return new LiteralStringParser(str, this);
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

        // TODO: Rewrite to code that does not use CustomizableParser
        return new CustomizableParser((input, offsetStart) => {
            const currentCodePoint = input.codePointAt(offsetStart);
            if (
                typeof currentCodePoint === 'number' &&
                minCodePoint <= currentCodePoint &&
                currentCodePoint <= maxCodePoint
            ) {
                const currentChar = String.fromCodePoint(currentCodePoint);
                return {
                    offsetEnd: offsetStart + currentChar.length,
                    valueGetter: () => currentChar,
                };
            }
            return undefined;
        }, this);
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
        // TODO: Rewrite to code that does not use CustomizableParser
        return new CustomizableParser(
            (input, offsetStart) =>
                exp.tryParse(input, offsetStart)
                    ? { offsetEnd: offsetStart, valueGetter: () => undefined }
                    : undefined,
            this,
        );
    }

    notFollowedBy<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<undefined> {
        const exp = this.seq(...args);
        // TODO: Rewrite to code that does not use CustomizableParser
        return new CustomizableParser(
            (input, offsetStart) =>
                exp.tryParse(input, offsetStart)
                    ? undefined
                    : { offsetEnd: offsetStart, valueGetter: () => undefined },
            this,
        );
    }

    seq<T extends readonly [ParserLike, ...ParserLike[]]>(
        ...args: T | [() => T]
    ): SequenceParser<T> {
        if (args.length < 1) {
            throw new Error('one or more arguments are required');
        }
        const [headArg, ...tailArgs] = args;
        if (typeof headArg === 'function' && !(headArg instanceof Parser)) {
            if (tailArgs.length >= 1) {
                throw new Error(
                    'the second and subsequent arguments cannot be specified. the first argument is the callback function',
                );
            }
            return new SequenceParser(this, headArg);
        }
        if (!SequenceParser.isValidExpressions([headArg])) {
            throw new TypeError(
                'only the Parser object, string or function can be specified as the first argument',
            );
        }
        if (!SequenceParser.isValidExpressions(args)) {
            throw new TypeError(
                'only the Parser object or string can be specified for the second argument and the subsequent arguments',
            );
        }
        return new SequenceParser(this, args);
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
            ...args: Parameters<CustomizableParserParseFunc<TResult>>
        ) => ReturnType<CustomizableParserParseFunc<TResult>>,
    ): Parser<TResult> {
        const [firstArg] = args;

        if (typeof firstArg === 'function' && !(firstArg instanceof Parser)) {
            // TODO: Rewrite to code that does not use CustomizableParser
            return new CustomizableParser((...parseArgs) => {
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
            }, this);
        }

        this.__assertIsExpsArray(
            args,
            'Only string values and Parser objects can be specified in the arguments',
        );
        // TODO: Rewrite to code that does not use CustomizableParser
        return new CustomizableParser(
            (...parseArgs) => callback(args, ...parseArgs),
            this,
        );
    }
}
