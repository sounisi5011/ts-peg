import { AnyOrMoreParser, Parser, ParserGenerator } from '../internal';

export class RepetitionParser<TResult> extends AnyOrMoreParser<
    TResult,
    TResult[]
> {
    private readonly __repeatCount: number;

    constructor(
        parserGenerator: ParserGenerator,
        prevParser: Parser<TResult>,
        count: number,
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

    protected __resultsValidator(results: TResult[]): results is TResult[] {
        return results.length === this.__repeatCount;
    }
}
