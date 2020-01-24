import { AnyOrMoreParser, ParseSuccessResult } from '../../internal';
import { isOneOrMoreTuple, OneOrMoreTuple } from '../../types';

export class OneOrMoreParser<TResult> extends AnyOrMoreParser<
    TResult,
    OneOrMoreTuple<ParseSuccessResult<TResult>>
> {
    protected __resultsValidator(
        results: ParseSuccessResult<TResult>[],
    ): results is OneOrMoreTuple<ParseSuccessResult<TResult>> {
        return isOneOrMoreTuple(results);
    }
}
