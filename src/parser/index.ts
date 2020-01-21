import * as typepark from 'typepark';

import {
    isOneOrMoreTuple,
    OneOrMoreReadonlyTuple,
    OneOrMoreTuple,
} from '../types';

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

interface ActionParserCacheMap extends WeakMap<Function, Parser<unknown>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<T>(key: (...args: any) => T): Parser<T> | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set<T>(key: (...args: any) => T, value: Parser<T>): this;
}

export abstract class Parser<TResult> {
    private readonly __memoMap: Map<
        string,
        Map<number, { result: ReturnType<ParseFunc<TResult>> }>
    > = new Map();

    protected abstract __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TResult>;

    private __zeroOrMoreCache?: Parser<TResult[]>;
    get zeroOrMore(): Parser<TResult[]> {
        if (this.__zeroOrMoreCache) return this.__zeroOrMoreCache;
        // TODO: Rewrite to code that does not use CustomizableParser
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return (this.__zeroOrMoreCache = new CustomizableParser(
            (input, offsetStart) => this.__repetitionsParse(input, offsetStart),
        ));
    }

    private __oneOrMoreCache?: Parser<OneOrMoreTuple<TResult>>;
    get oneOrMore(): Parser<OneOrMoreTuple<TResult>> {
        if (this.__oneOrMoreCache) return this.__oneOrMoreCache;
        // TODO: Rewrite to code that does not use CustomizableParser
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return (this.__oneOrMoreCache = new CustomizableParser(
            (input, offsetStart) => {
                const { data, offsetEnd } = this.__repetitionsParse(
                    input,
                    offsetStart,
                );
                return isOneOrMoreTuple(data) ? { offsetEnd, data } : undefined;
            },
        ));
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
        ));
    }

    times<TCount extends number>(
        count: TCount,
    ): Parser<
        // TResult tuple if TCount is a numeric literal type, otherwise a TResult array
        //   TCount == 0 | 1 | 2 | ... -> typepark.Repeat<TResult, TCount>
        //   TCount == number          -> TResult[]
        number extends TCount ? TResult[] : typepark.Repeat<TResult, TCount>
    >;

    times(count: number): Parser<TResult[]> {
        // TODO: Rewrite to code that does not use CustomizableParser
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return new CustomizableParser((input, offsetStart) => {
            const { data, offsetEnd } = this.__repetitionsParse(
                input,
                offsetStart,
                { maxCount: count },
            );
            return data.length === count ? { offsetEnd, data } : undefined;
        });
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
        });
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

    private __repetitionsParse(
        input: string,
        offsetStart: number,
        { maxCount = Infinity } = {},
    ): { offsetEnd: number; data: TResult[] } {
        const results: TResult[] = [];
        let offset = offsetStart;
        while (results.length <= maxCount) {
            const result = this.tryParse(input, offset);
            if (!result) break;
            results.push(result.data);
            offset = result.offsetEnd;
        }
        return {
            offsetEnd: offset,
            data: results,
        };
    }
}

export class CustomizableParser<TResult> extends Parser<TResult> {
    private readonly __parseFunc: ParseFunc<TResult>;

    constructor(parseFunc: ParseFunc<TResult>) {
        super();
        this.__parseFunc = parseFunc;
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TResult> {
        return this.__parseFunc(input, offsetStart);
    }
}
