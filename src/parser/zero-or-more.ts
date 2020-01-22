import { AnyOrMoreParser } from '../internal';

export class ZeroOrMoreParser<TResult> extends AnyOrMoreParser<
    TResult,
    TResult[]
> {
    protected __resultsValidator(results: TResult[]): results is TResult[] {
        return results.length >= 0;
    }
}
