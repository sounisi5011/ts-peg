import {
    isParserLike,
    ParseFailureResult,
    Parser,
    ParseResult,
    ParserGenerator,
    ParserLike,
    parserLike2Parser,
    ParseSuccessResult,
} from '../internal';
import { hasProperty } from '../utils';
import { CacheStore } from '../utils/cache-store';

export class PredicateExecutionEnvironment {
    readonly input: string;
    readonly offset: number;

    constructor(input: string, options: { offsetStart: number }) {
        this.input = input;
        this.offset = options.offsetStart;
    }
}

export type PredicateFunc = (envs: PredicateExecutionEnvironment) => boolean;

const parserCache = new CacheStore<
    [
        Function,
        ParserGenerator,
        Parser<unknown> | (() => Parser<unknown>) | PredicateFunc,
        boolean,
    ],
    PredicateParser
>();

export class PredicateParser extends Parser<null> {
    private readonly __predicate:
        | Parser<unknown>
        | (() => Parser<unknown>)
        | PredicateFunc;

    private readonly __negative: boolean;

    private readonly __errorMessage = {
        predicateType:
            'only the Parser object, string, RegExp or function can be specified for the predicate option',
        predicateFuncRetType:
            'the value returned by callback function must be a Parser object or boolean',
    };

    constructor({
        parserGenerator,
        predicate,
        negative,
        errorMessage = {},
    }: {
        parserGenerator: ParserGenerator;
        predicate: ParserLike | (() => Parser<unknown>) | PredicateFunc;
        negative: boolean;
        errorMessage?: Partial<
            Record<
                'predicateType' | 'predicateFuncRetType',
                string | ((message: string) => string)
            >
        >;
    }) {
        super(parserGenerator);

        for (const [type, msg] of Object.entries(errorMessage)) {
            if (hasProperty(this.__errorMessage, type)) {
                Object.assign(this.__errorMessage, {
                    [type]:
                        typeof msg === 'function'
                            ? msg(String(this.__errorMessage[type]))
                            : msg,
                });
            }
        }
        if (isParserLike(predicate)) {
            this.__predicate = parserLike2Parser(parserGenerator, predicate);
        } else if (typeof predicate === 'function') {
            this.__predicate = predicate;
        } else {
            throw new TypeError(this.__errorMessage.predicateType);
        }
        this.__negative = negative;

        const cachedParser = parserCache.upsertWithTypeGuard(
            [
                this.constructor,
                this.parserGenerator,
                this.__predicate,
                negative,
            ],
            undefined,
            () => this,
            (value): value is this => value instanceof this.constructor,
        );
        if (cachedParser && cachedParser !== this) return cachedParser;
    }

    protected __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<null> {
        const result = this.__getPredicateResult(
            input,
            offsetStart,
            stopOffset,
        );
        const isMatch = result instanceof ParseSuccessResult || result === true;
        const isSuccess = this.__negative ? !isMatch : isMatch;
        const allowCache =
            typeof result === 'boolean' ? false : result.allowCache;
        return isSuccess
            ? new ParseSuccessResult({
                  offsetEnd: offsetStart,
                  dataGenerator: () => null,
                  allowCache,
              })
            : new ParseFailureResult({ allowCache });
    }

    private __getPredicateResult(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<unknown> | boolean {
        if (this.__predicate instanceof Parser) {
            return this.__predicate.tryParse(input, offsetStart, stopOffset);
        }

        const ret = this.__predicate(
            new PredicateExecutionEnvironment(input, { offsetStart }),
        );
        if (ret instanceof Parser) {
            return ret.tryParse(input, offsetStart, stopOffset);
        } else if (typeof ret === 'boolean') {
            return ret;
        } else {
            throw new TypeError(this.__errorMessage.predicateFuncRetType);
        }
    }
}
