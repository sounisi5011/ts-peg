import {
    ConverterParser,
    ParseFailureResult,
    Parser,
    ParseResult,
    PredicateExecutionEnvironment,
} from '../../internal';
import { CacheStore } from '../../utils/cache-store';

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

const parserCache = new CacheStore<
    [Function, Parser<unknown>, Function],
    unknown
>();

export class ActionParser<TPrevResult, TActionResult> extends ConverterParser<
    TPrevResult,
    TActionResult
> {
    protected readonly __action: ActionFunc<TPrevResult, TActionResult>;

    constructor(
        prevParser: Parser<TPrevResult>,
        action: ActionFunc<TPrevResult, TActionResult>,
    ) {
        super(prevParser);
        this.__action = action;

        const cachedParser = parserCache.upsertWithTypeGuard(
            [this.constructor, prevParser, action],
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
    ): ParseResult<TActionResult> {
        const result = this.__prevParser.tryParse(
            input,
            offsetStart,
            stopOffset,
        );
        if (result instanceof ParseFailureResult) return result;
        const data = this.__action(
            result.data,
            new ActionExecutionEnvironment(input, {
                offsetStart,
                offsetEnd: result.offsetEnd,
            }),
        );
        return result.clone({
            dataGenerator: () => data,
            allowCache: false,
        });
    }
}
