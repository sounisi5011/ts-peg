import { AnyOrMoreParser, Parser, ParseSuccessResult } from '../internal';

export class TimesParser<TResult> extends AnyOrMoreParser<
    TResult,
    ParseSuccessResult<TResult>[]
> {
    private readonly __repeatCount: number;

    constructor(prevParser: Parser<TResult>, count: number) {
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

        super(prevParser, { resultsLengthLimit: count });
        this.__repeatCount = count;
    }

    protected __resultsValidator(
        results: ParseSuccessResult<TResult>[],
    ): results is ParseSuccessResult<TResult>[] {
        return results.length === this.__repeatCount;
    }
}
