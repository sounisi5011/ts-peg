/*
 * Modify the Array.isArray function so that it can correctly Type Guard the ReadonlyArray type.
 * @example
 *   (Array.isArray as isReadonlyOrWritableArray)(value)
 *   (<isReadonlyOrWritableArray>Array.isArray)(value)
 */
type isReadonlyOrWritableArray = (
    value: unknown,
) => value is ReadonlyArray<unknown>;

export class PredicateExecutionEnvironment {
    readonly input: string;
    readonly offset: number;

    constructor(input: string, options: { offsetStart: number }) {
        this.input = input;
        this.offset = options.offsetStart;
    }
}

export class ActionExecutionEnvironment extends PredicateExecutionEnvironment {
    readonly range: readonly [number, number];

    constructor(
        input: string,
        options: { offsetStart: number; offsetEnd: number },
    ) {
        const { offsetEnd, ...superOpts } = options;
        super(input, superOpts);
        this.range = [this.offset, offsetEnd];
    }

    get text(): string {
        return this.input.substring(...this.range);
    }
}

export type Predicate = (envs: PredicateExecutionEnvironment) => boolean;

export type ParseFunc<TResult> = (
    input: string,
    offsetStart: number,
) => { offsetEnd: number; data: TResult } | undefined;

export class Parser<TResult> {
    private readonly __parseFunc: ParseFunc<TResult>;

    constructor(parseFunc: ParseFunc<TResult>) {
        this.__parseFunc = parseFunc;
    }

    readonly zeroOrMore: Parser<[] | TResult[]> = new Parser(
        (input, offsetStart) => {
            const data: TResult[] = [];

            let result;
            let offset = offsetStart;
            while ((result = this.tryParse(input, offset))) {
                data.push(result.data);
                offset = result.offsetEnd;
            }

            return { offsetEnd: offset, data };
        },
    );

    readonly oneOrMore: Parser<TResult[]> = new Parser((input, offsetStart) => {
        const data: TResult[] = [];

        let result;
        let offset = offsetStart;
        while ((result = this.tryParse(input, offset))) {
            data.push(result.data);
            offset = result.offsetEnd;
        }

        return data.length >= 1 ? { offsetEnd: offset, data } : undefined;
    });

    readonly optional: Parser<TResult | undefined> = new Parser(
        (input, offsetStart) => {
            const result = this.tryParse(input, offsetStart);
            return {
                offsetEnd: result ? result.offsetEnd : offsetStart,
                data: result ? result.data : undefined,
            };
        },
    );

    action<TActionRes>(
        actionFn: (
            exp: TResult,
            envs: ActionExecutionEnvironment,
        ) => TActionRes,
    ): Parser<TActionRes> {
        return new Parser((input, offsetStart) => {
            const result = this.tryParse(input, offsetStart);
            return result
                ? {
                      ...result,
                      data: actionFn(
                          result.data,
                          new ActionExecutionEnvironment(input, {
                              offsetStart,
                              offsetEnd: result.offsetEnd,
                          }),
                      ),
                  }
                : undefined;
        });
    }

    parse(input: string, offsetStart: number = 0): TResult {
        const result = this.tryParse(input, offsetStart);
        if (!result) {
            throw new Error('Parse fail!');
        }
        const { data } = result;
        return data;
    }

    tryParse(
        input: string,
        offsetStart: number,
    ): { offsetEnd: number; data: TResult } | undefined {
        const result = this.__parseFunc(input, offsetStart);
        return result;
    }
}

export type ParserLike = Parser<unknown> | string;

export type ParserResult<T extends Parser<unknown>> = T extends Parser<infer U>
    ? U
    : never;
export type ParserLike2Result<T extends ParserLike> = T extends Parser<unknown>
    ? ParserResult<T>
    : T;
export type ParserTuple2ResultTuple<T extends ReadonlyArray<ParserLike>> = {
    -readonly [P in keyof T]: T[P] extends ParserLike
        ? ParserLike2Result<T[P]>
        : T[P];
};

export class ParserGenerator {
    readonly any: Parser<string> = new Parser((input, offsetStart) => {
        // Note: Use a string iterator to retrieve Unicode surrogate pair one character (eg, emoji, old kanji, etc.).
        for (const char of input.substring(offsetStart, offsetStart + 2)) {
            return { offsetEnd: offsetStart + char.length, data: char };
        }
        return undefined;
    });

    str<T extends string>(str: T): Parser<T> {
        return new Parser((input, offsetStart) =>
            input.startsWith(str, offsetStart)
                ? { offsetEnd: offsetStart + str.length, data: str }
                : undefined,
        );
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

    zeroOrMore<T extends ReadonlyArray<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<[] | ParserTuple2ResultTuple<T>[]> {
        return this.seq(...args).zeroOrMore;
    }

    oneOrMore<T extends ReadonlyArray<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T>[]> {
        return this.seq(...args).oneOrMore;
    }

    optional<T extends ReadonlyArray<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T> | undefined> {
        return this.seq(...args).optional;
    }

    followedBy<T extends ReadonlyArray<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<undefined> {
        const exp = this.seq(...args);
        return new Parser((input, offsetStart) =>
            exp.tryParse(input, offsetStart)
                ? { offsetEnd: offsetStart, data: undefined }
                : undefined,
        );
    }

    notFollowedBy<T extends ReadonlyArray<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<undefined> {
        const exp = this.seq(...args);
        return new Parser((input, offsetStart) =>
            exp.tryParse(input, offsetStart)
                ? undefined
                : { offsetEnd: offsetStart, data: undefined },
        );
    }

    seq<T extends ReadonlyArray<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T>> {
        return this.__validateSequenceArgs(args, (exps, input, offsetStart) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore - Type 'never[]' is not assignable to type 'ParserTuple2ResultTuple<T>'.
            const data: ParserTuple2ResultTuple<T> = [];
            let offset = offsetStart;
            for (const exp of exps as ReadonlyArray<T[number]>) {
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

    or<T extends ReadonlyArray<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserLike2Result<T[number]>> {
        return this.__validateSequenceArgs(args, (exps, input, offsetStart) => {
            for (const exp of exps as ReadonlyArray<T[number]>) {
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
        value: ReadonlyArray<unknown>,
        errorMessage: string,
    ): asserts value is ReadonlyArray<ParserLike>;

    private __assertIsExpsArray(
        value: ReadonlyArray<unknown>,
        errorMessage: string,
    ): asserts value is ReadonlyArray<ParserLike> {
        if (
            !value.every(
                item => typeof item === 'string' || item instanceof Parser,
            )
        ) {
            throw new TypeError(errorMessage);
        }
    }

    private __validateSequenceArgs<
        TExps extends ReadonlyArray<ParserLike>,
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

export default new ParserGenerator();
