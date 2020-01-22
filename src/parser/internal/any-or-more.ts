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
        AnyOrMoreParser<TResult, TResult[]>
    > {
    get<TResultData extends TResult[]>(
        key: (results: TResult[]) => results is TResultData,
    ): AnyOrMoreParser<TResult, TResultData> | undefined;
    set<TResultData extends TResult[]>(
        key: (results: TResult[]) => results is TResultData,
        value: AnyOrMoreParser<TResult, TResultData>,
    ): this;
}

export abstract class AnyOrMoreParser<
    TResult,
    TResultData extends TResult[]
> extends Parser<TResultData> {
    private readonly __prevParser: Parser<TResult>;

    constructor(parserGenerator: ParserGenerator, prevParser: Parser<TResult>) {
        super(parserGenerator);
        this.__prevParser = prevParser;

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

        let result;
        let offsetNext = offsetStart;
        while ((result = this.__prevParser.tryParse(input, offsetNext))) {
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

        const cachedParser = parserCacheMapLv2.get(this.__resultsValidator);
        if (!cachedParser) {
            parserCacheMapLv2.set(this.__resultsValidator, this);
        }

        return cachedParser;
    }
}
