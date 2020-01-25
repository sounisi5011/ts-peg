import {
    Parser,
    ParserGenerator,
    ParserResultDataType,
} from '../../../internal';
import {
    isReadonlyOrWritableArray,
    OneOrMoreReadonlyTuple,
    OneOrMoreTuple,
} from '../../../types';
import { CacheStore } from '../../../utils/cache-store';

export type ParserLike = Parser<unknown> | string;

// string | Parser<42> -> string | 42
export type ParserLike2Result<T extends ParserLike> = T extends Parser<unknown>
    ? ParserResultDataType<T>
    : T;

// ['foo', Parser<42>, 'bar', Parser<true>, ...] -> ['foo', 42, 'bar', true, ...]
export type ParserLikeTuple2ResultTuple<T extends readonly ParserLike[]> = {
    -readonly [P in keyof T]: T[P] extends ParserLike
        ? ParserLike2Result<T[P]>
        : T[P];
};

export function isParserLikeList(
    expressions: readonly unknown[],
): expressions is readonly ParserLike[] {
    return expressions.every(
        exp => typeof exp === 'string' || exp instanceof Parser,
    );
}

const parserCache = new CacheStore<
    | [ParserGenerator, ...Parser<unknown>[]]
    | [ParserGenerator, () => readonly ParserLike[]],
    ReduceParser<unknown, OneOrMoreReadonlyTuple<ParserLike>>
>();

export abstract class ReduceParser<
    TResult,
    TParserLikeTuple extends OneOrMoreReadonlyTuple<ParserLike>
> extends Parser<TResult> {
    private __cachedExps: OneOrMoreTuple<Parser<unknown>> | undefined;
    private readonly __inputExps:
        | OneOrMoreTuple<Parser<unknown>>
        | (() => TParserLikeTuple);

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
        if (cachedParser && cachedParser !== this) return cachedParser;
    }

    protected __exps(): OneOrMoreTuple<Parser<unknown>> {
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
            if (!isParserLikeList(expressions)) {
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
        if (!isParserLikeList(exps)) {
            throw new TypeError(
                'the value returned by callback function must be an array with Parser objects or strings',
            );
        }
        return exps;
    }
}
