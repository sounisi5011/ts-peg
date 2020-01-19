/*
 * Modify the Array.isArray function so that it can correctly Type Guard the ReadonlyArray type.
 * @example
 *   (Array.isArray as isReadonlyOrWritableArray)(value)
 *   (<isReadonlyOrWritableArray>Array.isArray)(value)
 */
type isReadonlyOrWritableArray = (
    value: unknown,
) => value is readonly unknown[];

type OneOrMoreTuple<T> = [T, ...T[]];
type OneOrMoreReadonlyTuple<T> = readonly [T, ...T[]];

function isOneOrMoreTuple<T>(value: T[]): value is OneOrMoreTuple<T>;
function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T>;
function isOneOrMoreTuple<T>(
    value: readonly T[],
): value is OneOrMoreReadonlyTuple<T> {
    return value.length >= 1;
}

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

interface ActionParserCacheMap extends WeakMap<Function, Parser<unknown>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<T>(key: (...args: any) => T): Parser<T> | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set<T>(key: (...args: any) => T, value: Parser<T>): this;
}

export class Parser<TResult> {
    private readonly __parseFunc: ParseFunc<TResult>;
    private readonly __memoMap: Map<
        string,
        Map<number, { result: ReturnType<ParseFunc<TResult>> }>
    > = new Map();

    constructor(parseFunc: ParseFunc<TResult>) {
        this.__parseFunc = parseFunc;
    }

    private __zeroOrMoreCache?: Parser<TResult[]>;
    get zeroOrMore(): Parser<TResult[]> {
        if (this.__zeroOrMoreCache) return this.__zeroOrMoreCache;
        return (this.__zeroOrMoreCache = new Parser((input, offsetStart) => {
            const data: TResult[] = [];

            let result;
            let offset = offsetStart;
            while ((result = this.tryParse(input, offset))) {
                data.push(result.data);
                offset = result.offsetEnd;
            }

            return { offsetEnd: offset, data };
        }));
    }

    private __oneOrMoreCache?: Parser<OneOrMoreTuple<TResult>>;
    get oneOrMore(): Parser<OneOrMoreTuple<TResult>> {
        if (this.__oneOrMoreCache) return this.__oneOrMoreCache;
        return (this.__oneOrMoreCache = new Parser((input, offsetStart) => {
            const data: TResult[] = [];

            let result;
            let offset = offsetStart;
            while ((result = this.tryParse(input, offset))) {
                data.push(result.data);
                offset = result.offsetEnd;
            }

            return isOneOrMoreTuple(data)
                ? { offsetEnd: offset, data }
                : undefined;
        }));
    }

    private __optionalCache?: Parser<TResult | undefined>;
    get optional(): Parser<TResult | undefined> {
        if (this.__optionalCache) return this.__optionalCache;
        return (this.__optionalCache = new Parser((input, offsetStart) => {
            const result = this.tryParse(input, offsetStart);
            return {
                offsetEnd: result ? result.offsetEnd : offsetStart,
                data: result ? result.data : undefined,
            };
        }));
    }

    private readonly __actionParserCacheMap: ActionParserCacheMap = new WeakMap<
        Function,
        Parser<any> // eslint-disable-line @typescript-eslint/no-explicit-any
    >();

    action<TActionRes extends OneOrMoreReadonlyTuple<unknown>>(
        actionFn: (
            exp: TResult,
            envs: ActionExecutionEnvironment,
        ) => TActionRes,
    ): Parser<TActionRes>;

    action<TActionRes extends unknown>(
        actionFn: (
            exp: TResult,
            envs: ActionExecutionEnvironment,
        ) => TActionRes,
    ): Parser<TActionRes>;

    action<TActionRes>(
        actionFn: (
            exp: TResult,
            envs: ActionExecutionEnvironment,
        ) => TActionRes,
    ): Parser<TActionRes> {
        let cachedParser = this.__actionParserCacheMap.get(actionFn);
        if (cachedParser) return cachedParser;

        cachedParser = new Parser((input, offsetStart) => {
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
        this.__actionParserCacheMap.set(actionFn, cachedParser);

        return cachedParser;
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
        if (input.length < offsetStart) return undefined;

        let memoStore = this.__memoMap.get(input);
        if (memoStore) {
            const memoData = memoStore.get(offsetStart);
            if (memoData) return memoData.result;
        } else {
            memoStore = new Map();
            this.__memoMap.set(input, memoStore);
        }

        const result = this.__parseFunc(input, offsetStart);
        memoStore.set(offsetStart, { result });

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
export type ParserTuple2ResultTuple<T extends readonly ParserLike[]> = {
    -readonly [P in keyof T]: T[P] extends ParserLike
        ? ParserLike2Result<T[P]>
        : T[P];
};

const characterClassParserCacheMap = new WeakMap<
    ParserGenerator,
    Map<string, CharacterClassParser>
>();

export class CharacterClassParser extends Parser<string> {
    readonly isInverse: boolean;
    private readonly __codePointRanges: {
        minCodePoint: number;
        maxCodePoint: number;
    }[];

    constructor(charactersPattern: string, parserGenerator: ParserGenerator) {
        super((input, offsetStart) => {
            const matchChar = this.isMatch(
                input.substring(offsetStart, offsetStart + 2),
            );
            return matchChar
                ? { offsetEnd: offsetStart + matchChar.length, data: matchChar }
                : undefined;
        });

        this.isInverse = charactersPattern.startsWith('^');
        this.__codePointRanges = this.__pattern2ranges(
            this.isInverse ? charactersPattern.substring(1) : charactersPattern,
        );

        let parserCacheMap = characterClassParserCacheMap.get(parserGenerator);
        if (!parserCacheMap) {
            parserCacheMap = new Map();
            characterClassParserCacheMap.set(parserGenerator, parserCacheMap);
        }

        const pattern = this.pattern;
        const cachedParser = parserCacheMap.get(pattern);
        if (cachedParser) return cachedParser;
        parserCacheMap.set(pattern, this);
    }

    get pattern(): string {
        return (
            (this.isInverse ? '^' : '') +
            this.__codePointRanges
                .map(({ minCodePoint, maxCodePoint }) =>
                    minCodePoint === maxCodePoint
                        ? String.fromCodePoint(minCodePoint)
                        : String.fromCodePoint(minCodePoint) +
                          '-' +
                          String.fromCodePoint(maxCodePoint),
                )
                .join('')
        );
    }

    isMatch(char: string): string | null {
        const codePoint = char.codePointAt(0);
        if (typeof codePoint !== 'number') return null;

        if (
            this.__codePointRanges.some(
                ({ minCodePoint, maxCodePoint }) =>
                    minCodePoint <= codePoint && codePoint <= maxCodePoint,
            )
        ) {
            return !this.isInverse ? String.fromCodePoint(codePoint) : null;
        }

        if (!this.isInverse) {
            const charCode = char.charCodeAt(0);
            if (typeof charCode === 'number') {
                if (
                    this.__codePointRanges.some(
                        ({ minCodePoint, maxCodePoint }) =>
                            minCodePoint <= charCode &&
                            charCode <= maxCodePoint,
                    )
                ) {
                    return String.fromCodePoint(charCode);
                }
            }
        }

        return !this.isInverse ? null : String.fromCodePoint(codePoint);
    }

    private __pattern2ranges(
        pattern: string,
    ): { minCodePoint: number; maxCodePoint: number }[] {
        const codePointRanges: {
            minCodePoint: number;
            maxCodePoint: number;
        }[] = [];
        const patternRegExp = /(.)-(.)|(.)/gsu;

        let match;
        while ((match = patternRegExp.exec(pattern))) {
            const [, char1, char2, singleChar] = match;
            if (singleChar) {
                const code = singleChar.codePointAt(0);
                if (typeof code === 'number') {
                    codePointRanges.push({
                        minCodePoint: code,
                        maxCodePoint: code,
                    });
                }
            } else {
                const code1 = char1.codePointAt(0);
                const code2 = char2.codePointAt(0);
                if (typeof code1 === 'number' && typeof code2 === 'number') {
                    codePointRanges.push({
                        minCodePoint: Math.min(code1, code2),
                        maxCodePoint: Math.max(code1, code2),
                    });
                }
            }
        }

        return codePointRanges
            .sort((a, b) => {
                const minDiff = a.minCodePoint - b.minCodePoint;
                return minDiff !== 0
                    ? minDiff
                    : a.maxCodePoint - b.maxCodePoint;
            })
            .reduce<typeof codePointRanges>((rangeList, range) => {
                const prevRange = rangeList.pop();
                if (!prevRange) return [range];

                if (prevRange.maxCodePoint + 1 === range.minCodePoint) {
                    return [
                        ...rangeList,
                        {
                            minCodePoint: prevRange.minCodePoint,
                            maxCodePoint: range.maxCodePoint,
                        },
                    ];
                }

                return [...rangeList, prevRange, range];
            }, []);
    }
}

interface StringParserCacheMap extends Map<string, Parser<string>> {
    get<T>(key: T): Parser<T> | undefined;
    set<T>(key: T, value: Parser<T>): this;
}

export class ParserGenerator {
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

    chars(chars: string): Parser<string> {
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

export default new ParserGenerator();
