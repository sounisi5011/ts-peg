import { Parser, ParseResult } from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const parserCache = new CacheStore<
    [Parser<unknown>, Function, number],
    AnyOrMoreParser<unknown, unknown[]>
>();

export abstract class AnyOrMoreParser<
    TResult,
    TResultData extends TResult[]
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
            (value): value is AnyOrMoreParser<TResult, TResultData> =>
                value instanceof this.constructor,
            this,
        );
        if (cachedParser) return cachedParser;
    }

    protected abstract __resultsValidator(
        results: TResult[],
    ): results is TResultData;

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TResultData> {
        const results: TResult[] = [];

        let offsetNext = offsetStart;
        while (results.length < this.__resultsLengthLimit) {
            const result = this.__prevParser.tryParse(input, offsetNext);
            if (!result) break;
            results.push(result.data);
            offsetNext = result.offsetEnd;
        }

        return this.__resultsValidator(results)
            ? { offsetEnd: offsetNext, data: results }
            : undefined;
    }
}
