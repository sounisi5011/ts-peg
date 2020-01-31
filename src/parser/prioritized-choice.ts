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
        for (const expression of this.__exps()) {
            const result = expression.tryParse(input, offsetStart, stopOffset);
            if (
                result instanceof ParseSuccessResult &&
                result.offsetEnd <= stopOffset
            ) {
                return new ParseSuccessResult({
                    offsetEnd: result.offsetEnd,
                    dataGenerator: () => result.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                    allowCache: true,
                });
            }
        }
        return new ParseFailureResult({ allowCache: true });
    }
}
