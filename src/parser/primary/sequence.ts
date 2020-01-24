import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParserResultDataType,
    ParseSuccessResult,
} from '../../internal';

export type ParserLike = Parser<unknown> | string;

// string | Parser<42> -> string | 42
type ParserLike2Result<T extends ParserLike> = T extends Parser<unknown>
    ? ParserResultDataType<T>
    : T;

// ['foo', Parser<42>, 'bar', Parser<true>, ...] -> ['foo', 42, 'bar', true, ...]
export type ParserLikeTuple2ResultTuple<T extends readonly ParserLike[]> = {
    -readonly [P in keyof T]: T[P] extends ParserLike
        ? ParserLike2Result<T[P]>
        : T[P];
};

export class SequenceParser<
    TParserLikeTuple extends readonly ParserLike[]
> extends Parser<ParserLikeTuple2ResultTuple<TParserLikeTuple>> {
    private readonly __inputExps: TParserLikeTuple | (() => TParserLikeTuple);
    private __cachedExps: Parser<unknown>[] | undefined;

    constructor(
        parserGenerator: ParserGenerator,
        expressions: TParserLikeTuple | (() => TParserLikeTuple),
    ) {
        super(parserGenerator);
        this.__inputExps = expressions;
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<ParserLikeTuple2ResultTuple<TParserLikeTuple>> {
        const results: ParseSuccessResult<unknown>[] = [];
        let nextOffset = offsetStart;
        for (const expression of this.__exps) {
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

    private get __exps(): Parser<unknown>[] {
        if (this.__cachedExps) return this.__cachedExps;
        const exps =
            typeof this.__inputExps === 'function'
                ? this.__inputExps()
                : this.__inputExps;
        return (this.__cachedExps = exps.map(expression =>
            expression instanceof Parser
                ? expression
                : this.parserGenerator.str(expression),
        ));
    }
}
