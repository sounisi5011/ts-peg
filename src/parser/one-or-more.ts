import { AnyOrMoreParser } from '../internal';
import { isOneOrMoreTuple, OneOrMoreTuple } from '../types';

export class OneOrMoreParser<TResult> extends AnyOrMoreParser<
    TResult,
    OneOrMoreTuple<TResult>
> {
    protected __resultsValidator(
        results: TResult[],
    ): results is OneOrMoreTuple<TResult> {
        return isOneOrMoreTuple(results);
    }
}
