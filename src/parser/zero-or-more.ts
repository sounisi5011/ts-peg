import { AnyOrMoreParser, ParseSuccessResult } from '../internal';

export class ZeroOrMoreParser<TResult> extends AnyOrMoreParser<
    TResult,
    ParseSuccessResult<TResult>[]
> {
    protected __resultsValidator(
        results: ParseSuccessResult<TResult>[],
    ): results is ParseSuccessResult<TResult>[] {
        return results.length >= 0;
    }
}
