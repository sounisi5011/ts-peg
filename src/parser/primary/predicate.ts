import {
    isParserLike,
    Parser,
    ParseResult,
    ParserGenerator,
    ParserLike,
    parserLike2Parser,
    ParseSuccessResult,
} from '../../internal';
import { CacheStore } from '../../utils/cache-store';

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

    constructor({
        parserGenerator,
        predicate,
        negative,
    }: {
        parserGenerator: ParserGenerator;
        predicate: ParserLike | (() => Parser<unknown>) | PredicateFunc;
        negative: boolean;
    }) {
        super(parserGenerator);
        this.__predicate = isParserLike(predicate)
            ? parserLike2Parser(parserGenerator, predicate)
            : predicate;
        this.__negative = negative;

        const cachedParser = parserCache.upsertWithTypeGuard(
            [this.parserGenerator, this.__predicate, negative],
            undefined,
            () => this,
            (value): value is this => value instanceof this.constructor,
        );
        if (cachedParser && cachedParser !== this) return cachedParser;
    }

    protected __parse(input: string, offsetStart: number): ParseResult<null> {
        const result = this.__getPredicateResult(input, offsetStart);
        const isMatch = result instanceof ParseSuccessResult || result === true;
        const isSuccess = this.__negative ? !isMatch : isMatch;
        return isSuccess
            ? new ParseSuccessResult(offsetStart, () => null)
            : undefined;
    }

    private __getPredicateResult(
        input: string,
        offsetStart: number,
    ): ParseResult<unknown> | boolean {
        if (this.__predicate instanceof Parser) {
            return this.__predicate.tryParse(input, offsetStart);
        }

        const ret = this.__predicate(
            new PredicateExecutionEnvironment(input, { offsetStart }),
        );
        return ret instanceof Parser
            ? ret.tryParse(input, offsetStart)
            : Boolean(ret);
    }
}
