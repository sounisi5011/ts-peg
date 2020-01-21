import { Parser, ParseResult, ParserGenerator } from '../internal';

type ParserCacheMapType = WeakMap<ParserGenerator, ParserCacheMapLv1Type>;
interface ParserCacheMapLv1Type
    extends WeakMap<Parser<unknown>, ParserCacheMapLv2Type<unknown>> {
    get<T>(key: Parser<T>): ParserCacheMapLv2Type<T> | undefined;
    set<T>(key: Parser<T>, value: ParserCacheMapLv2Type<T>): this;
}
type ParserCacheMapLv2Type<T> = Map<number, ParserCacheMapLv3Type<T>>;
type ParserCacheMapLv3Type<T> = Map<number, RepetitionParser<T>>;

const repetitionParserCacheMap: ParserCacheMapType = new WeakMap();

export class RepetitionParser<TResult> extends Parser<TResult[]> {
    private readonly __prevParser: Parser<TResult>;
    private readonly __minCount: number;
    private readonly __maxCount: number;

    constructor(
        prevParser: Parser<TResult>,
        minCount: number,
        maxCount: number,
        { parserGenerator }: { parserGenerator: ParserGenerator },
    ) {
        if (typeof minCount !== 'number') {
            throw new TypeError(
                'second argument "minCount" must be zero or a positive integer',
            );
        }
        if (!(Number.isInteger(minCount) && minCount >= 0)) {
            throw new RangeError(
                'second argument "minCount" must be zero or a positive integer',
            );
        }
        if (typeof maxCount !== 'number') {
            throw new TypeError(
                'third argument "maxCount" must be zero or a positive integer or Infinity',
            );
        }
        if (
            !(
                (Number.isInteger(maxCount) || maxCount === Infinity) &&
                maxCount >= 0
            )
        ) {
            throw new RangeError(
                'third argument "maxCount" must be zero or a positive integer or Infinity',
            );
        }

        super(parserGenerator);

        if (!(minCount <= maxCount)) {
            throw new RangeError(
                'argument "maxCount" must be greater than or equal to "minCount"',
            );
        }

        this.__prevParser = prevParser;
        this.__minCount = minCount;
        this.__maxCount = maxCount;

        let parserCacheMapLv1 = repetitionParserCacheMap.get(parserGenerator);
        if (!parserCacheMapLv1) {
            parserCacheMapLv1 = new Map();
            repetitionParserCacheMap.set(parserGenerator, parserCacheMapLv1);
        }

        let parserCacheMapLv2 = parserCacheMapLv1.get(prevParser);
        if (!parserCacheMapLv2) {
            parserCacheMapLv2 = new Map();
            parserCacheMapLv1.set(prevParser, parserCacheMapLv2);
        }

        let parserCacheMapLv3 = parserCacheMapLv2.get(minCount);
        if (!parserCacheMapLv3) {
            parserCacheMapLv3 = new Map();
            parserCacheMapLv2.set(minCount, parserCacheMapLv3);
        }

        const cachedParser = parserCacheMapLv3.get(maxCount);
        if (cachedParser) return cachedParser;
        parserCacheMapLv3.set(maxCount, this);
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TResult[]> {
        const results: TResult[] = [];

        let offsetNext = offsetStart;
        while (results.length < this.__maxCount) {
            const result = this.__prevParser.tryParse(input, offsetNext);
            if (!result) break;
            results.push(result.data);
            offsetNext = result.offsetEnd;
        }

        return this.__minCount <= results.length
            ? { offsetEnd: offsetNext, data: results }
            : undefined;
    }
}
