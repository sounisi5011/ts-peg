import {
    ParseResult,
    ParserLike,
    ParserLike2Result,
    ParseSuccessResult,
    ReduceParser,
} from '../../internal';

export class PrioritizedChoiceParser<
    TParserLikeTuple extends readonly [ParserLike, ...ParserLike[]]
> extends ReduceParser<
    ParserLike2Result<TParserLikeTuple[number]>,
    TParserLikeTuple
> {
    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<ParserLike2Result<TParserLikeTuple[number]>> {
        for (const expression of this.__exps()) {
            const result = expression.tryParse(input, offsetStart);
            if (result) {
                return new ParseSuccessResult(
                    result.offsetEnd,
                    () => result.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                );
            }
        }
        return undefined;
    }
}
