import { Parser, ParseResult, ParserGenerator } from '../internal';
import { isOneOrMoreTuple, OneOrMoreTuple } from '../types';

const parserCacheMap: ParserCacheMapType = new WeakMap();
type ParserCacheMapType = WeakMap<ParserGenerator, ParserCacheMapLv1Type>;
interface ParserCacheMapLv1Type extends WeakMap<Parser<unknown>, unknown> {
    get<T>(key: Parser<T>): OneOrMoreParser<T> | undefined;
    set<T>(key: Parser<T>, value: OneOrMoreParser<T>): this;
}

export class OneOrMoreParser<TResult> extends Parser<OneOrMoreTuple<TResult>> {
    private readonly __prevParser: Parser<TResult>;

    constructor(parserGenerator: ParserGenerator, prevParser: Parser<TResult>) {
        super(parserGenerator);
        this.__prevParser = prevParser;

        const cachedParser = this.__getCachedParser(parserGenerator);
        if (cachedParser) return cachedParser;
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<OneOrMoreTuple<TResult>> {
        const results: TResult[] = [];

        let result;
        let offsetNext = offsetStart;
        while ((result = this.__prevParser.tryParse(input, offsetNext))) {
            if (!result) break;
            results.push(result.data);
            offsetNext = result.offsetEnd;
        }

        return isOneOrMoreTuple(results)
            ? { offsetEnd: offsetNext, data: results }
            : undefined;
    }

    private __getCachedParser(
        parserGenerator: ParserGenerator,
    ): OneOrMoreParser<TResult> | undefined {
        let parserCacheMapLv1 = parserCacheMap.get(parserGenerator);
        if (!parserCacheMapLv1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parserCacheMapLv1 = new WeakMap<any, any>();
            parserCacheMap.set(parserGenerator, parserCacheMapLv1);
        }

        const cachedParser = parserCacheMapLv1.get(this.__prevParser);
        if (!cachedParser) {
            parserCacheMapLv1.set(this.__prevParser, this);
        }

        return cachedParser;
    }
}
