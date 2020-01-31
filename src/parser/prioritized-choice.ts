import {
    ParseFailureResult,
    ParseResult,
    ParserLike,
    ParserLike2Result,
    ParseSuccessResult,
    ReduceParser,
} from '../internal';
import { OneOrMoreReadonlyTuple } from '../types';

export class PrioritizedChoiceParser<
    TParserLikeTuple extends OneOrMoreReadonlyTuple<ParserLike>
> extends ReduceParser<
    ParserLike2Result<TParserLikeTuple[number]>,
    TParserLikeTuple
> {
    protected __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<ParserLike2Result<TParserLikeTuple[number]>> {
        let allowCache = true;
        for (const expression of this.__exps()) {
            const result = expression.tryParse(input, offsetStart, stopOffset);
            allowCache = allowCache && result.allowCache;
            if (
                result instanceof ParseSuccessResult &&
                result.offsetEnd <= stopOffset
            )
                return result.clone({ allowCache });
        }
        return new ParseFailureResult({ allowCache });
    }
}
