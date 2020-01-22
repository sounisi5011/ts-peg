import {
    ActionFunc,
    ActionParser,
    CustomizableParser,
    OneOrMoreParser,
    ParserGenerator,
    TimesParser,
    ZeroOrMoreParser,
} from '../internal';
import { RepeatTuple } from '../types';

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

export type Predicate = (envs: PredicateExecutionEnvironment) => boolean;

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

    get parserGenerator(): ParserGenerator {
        return this.__parserGenerator;
    }

    get zeroOrMore(): Parser<[...TResult[]]> {
        return new ZeroOrMoreParser(this);
    }

    get oneOrMore(): Parser<[TResult, ...TResult[]]> {
        return new OneOrMoreParser(this);
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

    times<TCount extends number>(
        count: TCount,
    ): Parser<RepeatTuple<TResult, TCount>>;

    times(count: number): Parser<TResult[]> {
        try {
            return new TimesParser(this, count);
        } catch (error) {
            if (error instanceof TypeError) {
                throw new TypeError('repeat count must be a positive integer');
            } else if (error instanceof RangeError) {
                throw new RangeError('repeat count must be a positive integer');
            }
            throw error;
        }
    }

    // Note: This line is **required**. DO NOT DELETE IT.
    //       If you do not specify a return type definition for actionFn, tuples are converted to arrays.
    //       However, this overload solves this problem.
    action<TActionRes extends readonly [unknown, ...unknown[]]>(
        actionFn: ActionFunc<TResult, TActionRes>,
    ): Parser<TActionRes>;

    action<TActionRes extends unknown>(
        actionFn: ActionFunc<TResult, TActionRes>,
    ): Parser<TActionRes>;

    action<TActionRes>(
        actionFn: ActionFunc<TResult, TActionRes>,
    ): Parser<TActionRes> {
        return new ActionParser(this, actionFn);
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
