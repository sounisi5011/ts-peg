import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParserResultDataType,
    ParseSuccessResult,
} from '../../internal';
import { isReadonlyOrWritableArray } from '../../types';

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

    static isValidExpressions(
        expressions: readonly unknown[],
    ): expressions is readonly ParserLike[] {
        return expressions.every(
            exp => typeof exp === 'string' || exp instanceof Parser,
        );
    }

    constructor(
        parserGenerator: ParserGenerator,
        expressions: TParserLikeTuple | (() => TParserLikeTuple),
    ) {
        super(parserGenerator);
        if (
            !(
                typeof expressions === 'function' ||
                (Array.isArray as isReadonlyOrWritableArray)(expressions)
            )
        ) {
            throw new TypeError(
                'only a function or an array containing Parser object and string can be specified as the second argument',
            );
        }
        if ((Array.isArray as isReadonlyOrWritableArray)(expressions)) {
            if (!SequenceParser.isValidExpressions(expressions)) {
                throw new TypeError(
                    'the second argument array can contain only Parser objects or strings',
                );
            }
        }
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
                ? this.__callback2exps(this.__inputExps)
                : this.__inputExps;
        return (this.__cachedExps = exps.map(expression =>
            expression instanceof Parser
                ? expression
                : this.parserGenerator.str(expression),
        ));
    }

    private __callback2exps(
        callback: () => TParserLikeTuple,
    ): TParserLikeTuple {
        const exps = callback();
        if (!(Array.isArray as isReadonlyOrWritableArray)(exps)) {
            throw new TypeError(
                'the value returned by callback function must be an array with Parser objects or strings',
            );
        }
        if (exps.length < 1) {
            throw new Error(
                'one or more values are required in the array returned by callback function',
            );
        }
        if (!SequenceParser.isValidExpressions(exps)) {
            throw new TypeError(
                'the value returned by callback function must be an array with Parser objects or strings',
            );
        }
        return exps;
    }
}
