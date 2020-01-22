import {
    CustomizableParser,
    OneOrMoreParser,
    ParserGenerator,
    TimesParser,
    ZeroOrMoreParser,
} from '../internal';
import { OneOrMoreReadonlyTuple } from '../types';

export type ParseFunc<TResult> = (
    input: string,
    offsetStart: number,
) => ParseResult<TResult>;

export type ParseResult<TResult> =
    | { offsetEnd: number; data: TResult }
    | undefined;

export type ParserResultDataType<T extends Parser<unknown>> = T extends Parser<
    infer U
>
    ? U
    : never;

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

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore - TS2589: Type instantiation is excessively deep and possibly infinite.
interface ActionParserCacheMap extends WeakMap<Function, Parser<unknown>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<T>(key: (...args: any) => T): Parser<T> | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set<T>(key: (...args: any) => T, value: Parser<T>): this;
}

export abstract class Parser<TResult> {
    private readonly __parserGenerator: ParserGenerator;
    private readonly __memoMap: Map<
        string,
        Map<number, { result: ReturnType<ParseFunc<TResult>> }>
    > = new Map();

    constructor(parserGenerator: ParserGenerator) {
        this.__parserGenerator = parserGenerator;
    }

    protected abstract __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TResult>;

    get zeroOrMore(): ZeroOrMoreParser<TResult> {
        return new ZeroOrMoreParser(this.__parserGenerator, this);
    }

    get oneOrMore(): OneOrMoreParser<TResult> {
        return new OneOrMoreParser(this.__parserGenerator, this);
    }

    private __optionalCache?: Parser<TResult | undefined>;
    get optional(): Parser<TResult | undefined> {
        if (this.__optionalCache) return this.__optionalCache;
        // TODO: Rewrite to code that does not use CustomizableParser
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return (this.__optionalCache = new CustomizableParser(
            (input, offsetStart) => {
                const result = this.tryParse(input, offsetStart);
                return {
                    offsetEnd: result ? result.offsetEnd : offsetStart,
                    data: result ? result.data : undefined,
                };
            },
            this.__parserGenerator,
        ));
    }

    times<TCount extends number>(count: TCount): TimesParser<TResult, TCount> {
        try {
            return new TimesParser(this.__parserGenerator, this, count);
        } catch (error) {
            if (error instanceof TypeError) {
                throw new TypeError('repeat count must be a positive integer');
            } else if (error instanceof RangeError) {
                throw new RangeError('repeat count must be a positive integer');
            }
            throw error;
        }
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

        // TODO: Rewrite to code that does not use CustomizableParser
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        cachedParser = new CustomizableParser((input, offsetStart) => {
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
        }, this.__parserGenerator);
        this.__actionParserCacheMap.set(actionFn, cachedParser);

        return cachedParser;
    }

    parse(input: string, offsetStart: number = 0): TResult {
        const result = this.tryParse(input, offsetStart);
        if (!result) {
            throw new Error('Parse fail!');
        }
        if (result.offsetEnd < input.length) {
            throw new Error('Parse fail! end-of-input was not reached');
        }
        return result.data;
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

        const result = this.__parse(input, offsetStart);
        memoStore.set(offsetStart, { result });

        return result;
    }
}
