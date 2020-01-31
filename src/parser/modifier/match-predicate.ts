import {
    ActionExecutionEnvironment,
    ActionFunc,
    ConverterParser,
    Parser,
    ParseResult,
    ParseSuccessResult,
} from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const parserCache = new CacheStore<
    [Function, Parser<unknown>, boolean],
    WeakMap<object, unknown>
>();

export class MatchPredicateParser<TResult> extends ConverterParser<TResult> {
    private readonly __negative: boolean;
    private readonly __predicate:
        | Parser<unknown>
        | ActionFunc<TResult, boolean>;

    private readonly __errorMessage = {
        predicateType:
            'only the Parser object or function can be specified for the predicate option',
        predicateFuncRetType:
            'the value returned by callback function must be a boolean',
    };

    constructor(
        prevParser: Parser<TResult>,
        predicate: Parser<unknown> | ActionFunc<TResult, boolean>,
        {
            negative,
            errorMessage = {},
        }: {
            negative: boolean;
            errorMessage?: Partial<
                Record<'predicateType' | 'predicateFuncRetType', string>
            >;
        },
    ) {
        super(prevParser);

        Object.assign(this.__errorMessage, errorMessage);
        if (!(predicate instanceof Parser || typeof predicate === 'function')) {
            throw new TypeError(this.__errorMessage.predicateType);
        }
        this.__predicate = predicate;
        this.__negative = negative;

        const cacheMap = parserCache.upsert(
            [this.constructor, prevParser, negative],
            undefined,
            () => new WeakMap<object, unknown>(),
        );
        const cachedParser = cacheMap.get(predicate);
        if (
            cachedParser !== this &&
            ((value: unknown): value is this =>
                value instanceof this.constructor)(cachedParser)
        ) {
            return cachedParser;
        }
        cacheMap.set(predicate, this);
    }

    protected __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<TResult> {
        const prevResult = this.__prevParser.tryParse(
            input,
            offsetStart,
            stopOffset,
        );
        if (!prevResult) return undefined;
        const result = this.__getPredicateResult(
            input,
            offsetStart,
            prevResult.offsetEnd,
            prevResult,
        );
        const isMatch =
            result instanceof ParseSuccessResult
                ? result.offsetEnd === prevResult.offsetEnd
                : result === true;
        const isSuccess = this.__negative ? !isMatch : isMatch;
        return isSuccess ? prevResult : undefined;
    }

    private __getPredicateResult(
        input: string,
        offsetStart: number,
        stopOffset: number,
        prevResult: ParseSuccessResult<TResult>,
    ): ParseResult<unknown> | boolean {
        if (this.__predicate instanceof Parser) {
            return this.__predicate.tryParse(input, offsetStart, stopOffset);
        }

        const ret = this.__predicate(
            prevResult.data,
            new ActionExecutionEnvironment(input, {
                offsetStart,
                offsetEnd: prevResult.offsetEnd,
            }),
        );
        if (typeof ret !== 'boolean') {
            throw new TypeError(this.__errorMessage.predicateFuncRetType);
        }
        return ret;
    }
}
