import {
    ParseFailureResult,
    ParseResult,
    ParserLike,
    ParserLikeTuple2ResultTuple,
    ParseSuccessResult,
    ReduceParser,
} from '../internal';
import { OneOrMoreReadonlyTuple } from '../types';

export class SequenceParser<
    TParserLikeTuple extends OneOrMoreReadonlyTuple<ParserLike>
> extends ReduceParser<
    ParserLikeTuple2ResultTuple<TParserLikeTuple>,
    TParserLikeTuple
> {
    protected __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<ParserLikeTuple2ResultTuple<TParserLikeTuple>> {
        const results: ParseSuccessResult<unknown>[] = [];
        let nextOffset = offsetStart;
        let allowCache = true;
        for (const expression of this.__exps()) {
            const result = expression.tryParse(input, nextOffset, stopOffset);
            if (!result.allowCache) allowCache = result.allowCache;
            if (result instanceof ParseFailureResult)
                return new ParseFailureResult({ allowCache });
            results.push(result);
            nextOffset = result.offsetEnd;
        }
        return new ParseSuccessResult({
            offsetEnd: nextOffset,
            dataGenerator: () => results.map(result => result.data) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            allowCache,
        });
    }
}
