import { Parser, ParseResult, ParserGenerator } from '../../internal';

const parserCacheMap: ParserCacheMapType = new WeakMap();
type ParserCacheMapType = WeakMap<ParserGenerator, ParserCacheMapLv1Type>;
interface ParserCacheMapLv1Type
    extends WeakMap<Parser<unknown>, ParserCacheMapLv2Type<unknown>> {
    get<TResult>(
        key: Parser<TResult>,
    ): ParserCacheMapLv2Type<TResult> | undefined;
    set<TResult>(
        key: Parser<TResult>,
        value: ParserCacheMapLv2Type<TResult>,
    ): this;
}
interface ParserCacheMapLv2Type<TResult>
    extends WeakMap<
        (results: TResult[]) => results is TResult[],
        ParserCacheMapLv3Type<TResult, TResult[]>
    > {
    get<TResultData extends TResult[]>(
        key: (results: TResult[]) => results is TResultData,
    ): ParserCacheMapLv3Type<TResult, TResultData> | undefined;
    set<TResultData extends TResult[]>(
        key: (results: TResult[]) => results is TResultData,
        value: ParserCacheMapLv3Type<TResult, TResultData>,
    ): this;
}
type ParserCacheMapLv3Type<TResult, TResultData extends TResult[]> = Map<
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
        parserGenerator: ParserGenerator,
        prevParser: Parser<TResult>,
        { resultsLengthLimit = Infinity } = {},
    ) {
        super(parserGenerator);
        this.__prevParser = prevParser;
        this.__resultsLengthLimit = resultsLengthLimit;

        const cachedParser = this.__getCachedParser(parserGenerator);
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

    private __getCachedParser(
        parserGenerator: ParserGenerator,
    ): AnyOrMoreParser<TResult, TResultData> | undefined {
        let parserCacheMapLv1 = parserCacheMap.get(parserGenerator);
        if (!parserCacheMapLv1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parserCacheMapLv1 = new WeakMap<any, any>();
            parserCacheMap.set(parserGenerator, parserCacheMapLv1);
        }

        let parserCacheMapLv2 = parserCacheMapLv1.get(this.__prevParser);
        if (!parserCacheMapLv2) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parserCacheMapLv2 = new WeakMap<any, any>();
            parserCacheMapLv1.set(this.__prevParser, parserCacheMapLv2);
        }

        let parserCacheMapLv3 = parserCacheMapLv2.get(this.__resultsValidator);
        if (!parserCacheMapLv3) {
            parserCacheMapLv3 = new Map();
            parserCacheMapLv2.set(this.__resultsValidator, parserCacheMapLv3);
        }

        const cachedParser = parserCacheMapLv3.get(this.__resultsLengthLimit);
        if (!cachedParser) {
            parserCacheMapLv3.set(this.__resultsLengthLimit, this);
        }

        return cachedParser;
    }
}
