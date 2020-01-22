import { AnyOrMoreParser, Parser, ParserGenerator } from '../internal';
import { RepeatTuple } from '../types';

export class TimesParser<
    TResult,
    TCount extends number
> extends AnyOrMoreParser<TResult, RepeatTuple<TResult, TCount>> {
    private readonly __repeatCount: TCount;

    constructor(
        parserGenerator: ParserGenerator,
        prevParser: Parser<TResult>,
        count: TCount,
    ) {
        if (typeof count !== 'number') {
            throw new TypeError(
                'third argument "count" must be zero or a positive integer',
            );
        }
        if (!(Number.isInteger(count) && count >= 0)) {
            throw new RangeError(
                'third argument "count" must be zero or a positive integer',
            );
        }

        super(parserGenerator, prevParser, { resultsLengthLimit: count });
        this.__repeatCount = count;
    }

    protected __resultsValidator(
        results: TResult[],
    ): results is RepeatTuple<TResult, TCount> {
        return results.length === this.__repeatCount;
    }
}
