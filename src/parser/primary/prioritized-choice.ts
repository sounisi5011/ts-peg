import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParserLike,
    ParserLike2Result,
    ParseSuccessResult,
    SequenceParser,
} from '../../internal';
import {
    isReadonlyOrWritableArray,
    OneOrMoreReadonlyTuple,
    OneOrMoreTuple,
} from '../../types';
import { CacheStore } from '../../utils/cache-store';

const parserCache = new CacheStore<
    | [ParserGenerator, ...Parser<unknown>[]]
    | [ParserGenerator, () => readonly ParserLike[]],
    PrioritizedChoiceParser<OneOrMoreReadonlyTuple<ParserLike>>
>();

export class PrioritizedChoiceParser<
    TParserLikeTuple extends OneOrMoreReadonlyTuple<ParserLike>
> extends Parser<ParserLike2Result<TParserLikeTuple[number]>> {
    private readonly __inputExps:
        | OneOrMoreTuple<Parser<unknown>>
        | (() => TParserLikeTuple);

    private __cachedExps: OneOrMoreTuple<Parser<unknown>> | undefined;

    constructor(
        parserGenerator: ParserGenerator,
        expressions: TParserLikeTuple | (() => TParserLikeTuple),
    ) {
        super(parserGenerator);

        this.__validateInputExps(expressions);
        this.__inputExps =
            typeof expressions === 'function'
                ? expressions
                : this.__parserLikeList2ParserList(expressions);

        const cachedParser = parserCache.upsertWithTypeGuard(
            typeof this.__inputExps === 'function'
                ? [this.parserGenerator, this.__inputExps]
                : [this.parserGenerator, ...this.__inputExps],
            undefined,
            () => this,
            (value): value is this => value instanceof this.constructor,
        );
        if (cachedParser !== this) return cachedParser;
    }

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

    private __exps(): OneOrMoreTuple<Parser<unknown>> {
        if (this.__cachedExps) return this.__cachedExps;
        const exps =
            typeof this.__inputExps === 'function'
                ? this.__callback2exps(this.__inputExps)
                : this.__inputExps;
        return (this.__cachedExps = this.__parserLikeList2ParserList(exps));
    }

    private __parserLikeList2ParserList(
        list: OneOrMoreReadonlyTuple<ParserLike>,
    ): OneOrMoreTuple<Parser<unknown>> {
        return list.map(item =>
            item instanceof Parser ? item : this.parserGenerator.str(item),
        ) as OneOrMoreTuple<Parser<unknown>>;
    }

    private __validateInputExps(
        expressions: TParserLikeTuple | (() => TParserLikeTuple),
    ): void {
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
            if (expressions.length < 1) {
                throw new RangeError(
                    'one or more values are required in the array of second argument',
                );
            }
            if (!SequenceParser.isValidExpressions(expressions)) {
                throw new TypeError(
                    'the second argument array can contain only Parser objects or strings',
                );
            }
        }
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
            throw new RangeError(
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
