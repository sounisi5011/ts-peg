import { Parser, ParseResult, ParseSuccessResult } from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const parserCache = new CacheStore<
    [Parser<unknown>, Function, number],
    AnyOrMoreParser<unknown, ParseSuccessResult<unknown>[]>
>();

type SuccessResultTuple2ResultTuple<T extends ParseSuccessResult<unknown>[]> = {
    [K in keyof T]: T[K] extends ParseSuccessResult<infer U> ? U : T[K];
};

export abstract class AnyOrMoreParser<
    TResult,
    TSuccessResultTuple extends ParseSuccessResult<TResult>[],
    TResultData extends TResult[] = SuccessResultTuple2ResultTuple<
        TSuccessResultTuple
    >
> extends Parser<TResultData> {
    private readonly __prevParser: Parser<TResult>;
    private readonly __resultsLengthLimit: number;

    constructor(
        prevParser: Parser<TResult>,
        { resultsLengthLimit = Infinity } = {},
    ) {
        super(prevParser.parserGenerator);
        this.__prevParser = prevParser;
        this.__resultsLengthLimit = resultsLengthLimit;

        const cachedParser = parserCache.getWithTypeGuard(
            [prevParser, this.__resultsValidator, resultsLengthLimit],
            (
                value,
            ): value is AnyOrMoreParser<
                TResult,
                TSuccessResultTuple,
                TResultData
            > => value instanceof this.constructor,
            this,
        );
        if (cachedParser) return cachedParser;
    }

    protected abstract __resultsValidator(
        results: ParseSuccessResult<TResult>[],
    ): results is TSuccessResultTuple;

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TResultData> {
        const results: ParseSuccessResult<TResult>[] = [];

        let offsetNext = offsetStart;
        while (results.length < this.__resultsLengthLimit) {
            const result = this.__prevParser.tryParse(input, offsetNext);
            if (!result) break;
            results.push(result);
            offsetNext = result.offsetEnd;
        }

        return this.__resultsValidator(results)
            ? new ParseSuccessResult(
                  offsetNext,
                  () => results.map(result => result.data) as TResultData,
              )
            : undefined;
    }
}
