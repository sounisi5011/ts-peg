import { Parser, ParserGenerator, ParserResultDataType } from '../../internal';
import {
    isReadonlyOrWritableArray,
    OneOrMoreReadonlyTuple,
    OneOrMoreTuple,
} from '../../types';
import { CacheStore } from '../../utils/cache-store';

export type ParserLike = Parser<unknown> | string | RegExp;

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

export function isParserLike(value: unknown): value is ParserLike {
    return (
        typeof value === 'string' ||
        value instanceof RegExp ||
        value instanceof Parser
    );
}

export function isParserLikeList(
    expressions: readonly unknown[],
): expressions is readonly ParserLike[] {
    return expressions.every(isParserLike);
}

export function parserLike2Parser(
    parserGenerator: ParserGenerator,
): (parserLike: ParserLike) => Parser<unknown>;
export function parserLike2Parser(
    parserGenerator: ParserGenerator,
    parserLike: ParserLike,
): Parser<unknown>;
export function parserLike2Parser(
    ...args: [ParserGenerator] | [ParserGenerator, ParserLike]
): Parser<unknown> | ((parserLike: ParserLike) => Parser<unknown>) {
    const [parserGenerator] = args;
    if (args.length === 1)
        return parserLike => parserLike2Parser(parserGenerator, parserLike);

    const [, parserLike] = args;
    if (parserLike instanceof Parser) return parserLike;
    if (parserLike instanceof RegExp) return parserGenerator.re(parserLike);
    return parserGenerator.str(parserLike);
}

const parserCache = new CacheStore<
    | [Function, ParserGenerator, ...Parser<unknown>[]]
    | [Function, ParserGenerator, () => readonly ParserLike[]],
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

    private readonly __errorMessage = {
        expsNotArray: 'second argument must be an array or a callback function',
        expsLenZero:
            'one or more values are required in the array of second argument',
        expsItemsInvalid:
            'second argument array must contain only the following values: Parser object, string, or RegExp',
        expsFuncRetNotArray:
            'the value returned by the callback function must be an array',
        expsFuncRetLenZero:
            'one or more values are required in the array returned by callback function',
        expsFuncRetItemsInvalid:
            'the value returned by the callback function must be an array containing only the following values: Parser object, string, or RegExp',
    };

    constructor(
        parserGenerator: ParserGenerator,
        expressions: TParserLikeTuple | (() => TParserLikeTuple),
        {
            errorMessage = {},
        }: {
            errorMessage?: Partial<
                Record<
                    | 'expsNotArray'
                    | 'expsLenZero'
                    | 'expsItemsInvalid'
                    | 'expsFuncRetNotArray'
                    | 'expsFuncRetLenZero'
                    | 'expsFuncRetItemsInvalid',
                    string
                >
            >;
        } = {},
    ) {
        super(parserGenerator);
        Object.assign(this.__errorMessage, errorMessage);
        this.__validateInputExps(expressions);
        this.__inputExps =
            typeof expressions === 'function'
                ? expressions
                : this.__parserLikeList2ParserList(expressions);

        const cachedParser = parserCache.upsertWithTypeGuard(
            typeof this.__inputExps === 'function'
                ? [this.constructor, this.parserGenerator, this.__inputExps]
                : [this.constructor, this.parserGenerator, ...this.__inputExps],
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
        return list.map(
            parserLike2Parser(this.parserGenerator),
        ) as OneOrMoreTuple<Parser<unknown>>;
    }

    private __validateInputExps(
        expressions: TParserLikeTuple | (() => TParserLikeTuple),
    ): void {
        if (typeof expressions === 'function') return;
        if (!(Array.isArray as isReadonlyOrWritableArray)(expressions)) {
            throw new TypeError(this.__errorMessage.expsNotArray);
        }

        if (expressions.length < 1) {
            throw new RangeError(this.__errorMessage.expsLenZero);
        }
        if (!isParserLikeList(expressions)) {
            throw new TypeError(this.__errorMessage.expsItemsInvalid);
        }
    }

    private __callback2exps(
        callback: () => TParserLikeTuple,
    ): TParserLikeTuple {
        const exps = callback();
        if (!(Array.isArray as isReadonlyOrWritableArray)(exps)) {
            throw new TypeError(this.__errorMessage.expsFuncRetNotArray);
        }
        if (exps.length < 1) {
            throw new RangeError(this.__errorMessage.expsFuncRetLenZero);
        }
        if (!isParserLikeList(exps)) {
            throw new TypeError(this.__errorMessage.expsFuncRetItemsInvalid);
        }
        return exps;
    }
}
