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
        super(parserGenerator);

        this.__validatePositiveInteger(
            minCount,
            'second argument "minCount" must be zero or a positive integer',
        );
        this.__validatePositiveInteger(
            maxCount,
            'third argument "maxCount" must be zero or a positive integer or Infinity',
            { passInfinity: true },
        );
        if (!(minCount <= maxCount)) {
            throw new RangeError(
                'argument "maxCount" must be greater than or equal to "minCount"',
            );
        }

        this.__prevParser = prevParser;
        this.__minCount = minCount;
        this.__maxCount = maxCount;

        const cachedParser = this.__getCachedParser(parserGenerator);
        if (cachedParser) return cachedParser;
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

    private __validatePositiveInteger(
        value: unknown,
        message: string,
        { passInfinity = false } = {},
    ): void {
        if (typeof value !== 'number') {
            throw new TypeError(message);
        }
        if (
            !(
                (Number.isInteger(value) && value >= 0) ||
                (passInfinity && value === Infinity)
            )
        ) {
            throw new RangeError(message);
        }
    }

    private __getCachedParser(
        parserGenerator: ParserGenerator,
    ): RepetitionParser<TResult> | undefined {
        let parserCacheMapLv1 = repetitionParserCacheMap.get(parserGenerator);
        if (!parserCacheMapLv1) {
            parserCacheMapLv1 = new Map();
            repetitionParserCacheMap.set(parserGenerator, parserCacheMapLv1);
        }

        let parserCacheMapLv2 = parserCacheMapLv1.get(this.__prevParser);
        if (!parserCacheMapLv2) {
            parserCacheMapLv2 = new Map();
            parserCacheMapLv1.set(this.__prevParser, parserCacheMapLv2);
        }

        let parserCacheMapLv3 = parserCacheMapLv2.get(this.__minCount);
        if (!parserCacheMapLv3) {
            parserCacheMapLv3 = new Map();
            parserCacheMapLv2.set(this.__minCount, parserCacheMapLv3);
        }

        const cachedParser = parserCacheMapLv3.get(this.__maxCount);
        if (!cachedParser) {
            parserCacheMapLv3.set(this.__maxCount, this);
        }

        return cachedParser;
    }
}
