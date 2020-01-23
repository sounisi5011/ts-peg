import {
    Parser,
    ParseResult,
    PredicateExecutionEnvironment,
} from '../internal';
import { CacheStore } from '../utils/cache-store';

export type ActionFunc<TPrevResult, TActionResult> = (
    exp: TPrevResult,
    envs: ActionExecutionEnvironment,
) => TActionResult;

export class ActionExecutionEnvironment extends PredicateExecutionEnvironment {
    readonly range: readonly [number, number];

    constructor(
        input: string,
        options: { offsetStart: number; offsetEnd: number },
    ) {
        const { offsetEnd, ...superOpts } = options;
        super(input, superOpts);
        this.range = [this.offset, offsetEnd];
    }

    get text(): string {
        return this.input.substring(...this.range);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const parserCache = new CacheStore<
    [Parser<unknown>, ActionFunc<any, unknown>],
    ActionParser<any, unknown>
>();
/* eslint-enable */

export class ActionParser<TPrevResult, TActionResult> extends Parser<
    TActionResult
> {
    private readonly __prevParser: Parser<TPrevResult>;
    private readonly __actionFn: ActionFunc<TPrevResult, TActionResult>;

    constructor(
        prevParser: Parser<TPrevResult>,
        actionFn: ActionFunc<TPrevResult, TActionResult>,
    ) {
        super(prevParser.parserGenerator);
        this.__prevParser = prevParser;
        this.__actionFn = actionFn;

        const cachedParser = parserCache.getWithTypeGuard(
            [prevParser, actionFn],
            (value): value is ActionParser<TPrevResult, TActionResult> =>
                value instanceof this.constructor,
            this,
        );
        if (cachedParser) return cachedParser;
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TActionResult> {
        const result = this.__prevParser.tryParse(input, offsetStart);
        if (!result) return undefined;
        const data = this.__actionFn(
            result.data,
            new ActionExecutionEnvironment(input, {
                offsetStart,
                offsetEnd: result.offsetEnd,
            }),
        );
        return { ...result, data };
    }
}
