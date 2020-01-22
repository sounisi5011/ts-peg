import { Parser, ParseResult, ParserGenerator } from '../internal';
import { MinToMaxTuple } from '../types';

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
    extends Map<number, ParserCacheMapLv3Type<TResult, number>> {
    get<TMin extends number>(
        key: TMin,
    ): ParserCacheMapLv3Type<TResult, TMin> | undefined;
    set<TMin extends number>(
        key: TMin,
        value: ParserCacheMapLv3Type<TResult, TMin>,
    ): this;
}
interface ParserCacheMapLv3Type<TResult, TMin extends number>
    extends Map<number, RepetitionParser<TResult, TMin, number>> {
    get<TMax extends number>(
        key: TMax,
    ): RepetitionParser<TResult, TMin, TMax> | undefined;
    set<TMax extends number>(
        key: TMax,
        value: RepetitionParser<TResult, TMin, TMax>,
    ): this;
}

const repetitionParserCacheMap: ParserCacheMapType = new WeakMap();

export class RepetitionParser<
    TResult,
    TMin extends number,
    TMax extends number
> extends Parser<MinToMaxTuple<TResult, TMin, TMax>> {
    private readonly __prevParser: Parser<TResult>;
    private readonly __minCount: TMin;
    private readonly __maxCount: TMax;

    constructor(
        prevParser: Parser<TResult>,
        minCount: TMin,
        maxCount: TMax,
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
    ): ParseResult<MinToMaxTuple<TResult, TMin, TMax>> {
        const results: TResult[] = [];

        let offsetNext = offsetStart;
        while (results.length < this.__maxCount) {
            const result = this.__prevParser.tryParse(input, offsetNext);
            if (!result) break;
            results.push(result.data);
            offsetNext = result.offsetEnd;
        }

        return this.__isLengthInRange(results)
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
    ): RepetitionParser<TResult, TMin, TMax> | undefined {
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

    private __isLengthInRange<T>(
        value: T[],
    ): value is MinToMaxTuple<T, TMin, TMax> {
        return (
            this.__minCount <= value.length && value.length <= this.__maxCount
        );
    }
}
