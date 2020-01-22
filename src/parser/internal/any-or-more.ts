import { Parser, ParseResult } from '../../internal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parserCacheMap: ParserCacheMapType = new WeakMap<any, any>();
interface ParserCacheMapType
    extends WeakMap<Parser<unknown>, ParserCacheMapLv1Type<unknown>> {
    get<TResult>(
        key: Parser<TResult>,
    ): ParserCacheMapLv1Type<TResult> | undefined;
    set<TResult>(
        key: Parser<TResult>,
        value: ParserCacheMapLv1Type<TResult>,
    ): this;
}
interface ParserCacheMapLv1Type<TResult>
    extends WeakMap<
        (results: TResult[]) => results is TResult[],
        ParserCacheMapLv2Type<TResult, TResult[]>
    > {
    get<TResultData extends TResult[]>(
        key: (results: TResult[]) => results is TResultData,
    ): ParserCacheMapLv2Type<TResult, TResultData> | undefined;
    set<TResultData extends TResult[]>(
        key: (results: TResult[]) => results is TResultData,
        value: ParserCacheMapLv2Type<TResult, TResultData>,
    ): this;
}
type ParserCacheMapLv2Type<TResult, TResultData extends TResult[]> = Map<
    number,
    AnyOrMoreParser<TResult, TResultData>
>;

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

        const cachedParser = this.__getCachedParser();
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

    private __getCachedParser():
        | AnyOrMoreParser<TResult, TResultData>
        | undefined {
        let parserCacheMapLv1 = parserCacheMap.get(this.__prevParser);
        if (!parserCacheMapLv1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parserCacheMapLv1 = new WeakMap<any, any>();
            parserCacheMap.set(this.__prevParser, parserCacheMapLv1);
        }

        let parserCacheMapLv2 = parserCacheMapLv1.get(this.__resultsValidator);
        if (!parserCacheMapLv2) {
            parserCacheMapLv2 = new Map();
            parserCacheMapLv1.set(this.__resultsValidator, parserCacheMapLv2);
        }

        const cachedParser = parserCacheMapLv2.get(this.__resultsLengthLimit);
        if (!cachedParser) {
            parserCacheMapLv2.set(this.__resultsLengthLimit, this);
        }

        return cachedParser;
    }
}
