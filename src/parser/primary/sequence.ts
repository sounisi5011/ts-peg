import {
    ParseResult,
    ParserLike,
    ParserLikeTuple2ResultTuple,
    ParseSuccessResult,
    ReduceParser,
} from '../../internal';

export class SequenceParser<
    TParserLikeTuple extends readonly [ParserLike, ...ParserLike[]]
> extends ReduceParser<
    ParserLikeTuple2ResultTuple<TParserLikeTuple>,
    TParserLikeTuple
> {
    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<ParserLikeTuple2ResultTuple<TParserLikeTuple>> {
        const results: ParseSuccessResult<unknown>[] = [];
        let nextOffset = offsetStart;
        for (const expression of this.__exps()) {
            const result = expression.tryParse(input, nextOffset);
            if (!result) return undefined;
            results.push(result);
            nextOffset = result.offsetEnd;
        }
        return new ParseSuccessResult(
            nextOffset,
            () => results.map(result => result.data) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        );
    }
}
