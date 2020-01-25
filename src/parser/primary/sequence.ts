import {
    ParseResult,
    ParserGenerator,
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
    constructor(
        parserGenerator: ParserGenerator,
        expressions: TParserLikeTuple | (() => TParserLikeTuple),
    ) {
        super(parserGenerator, expressions);

        const cachedParser = this.__getCachedParser();
        if (cachedParser) return cachedParser;
    }

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
