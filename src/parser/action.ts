import {
    Parser,
    ParseResult,
    PredicateExecutionEnvironment,
} from '../internal';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parserCacheMap: ParserCacheMapType = new WeakMap<any, any>();
interface ParserCacheMapType
    extends WeakMap<Parser<unknown>, ParserCacheMapLv1Type<unknown>> {
    get<TPrevResult>(
        key: Parser<TPrevResult>,
    ): ParserCacheMapLv1Type<TPrevResult> | undefined;
    set<TPrevResult>(
        key: Parser<TPrevResult>,
        value: ParserCacheMapLv1Type<TPrevResult>,
    ): this;
}
interface ParserCacheMapLv1Type<TPrevResult>
    extends WeakMap<
        ActionFunc<TPrevResult, unknown>,
        ActionParser<TPrevResult, unknown>
    > {
    get<TActionResult>(
        key: ActionFunc<TPrevResult, TActionResult>,
    ): ActionParser<TPrevResult, TActionResult> | undefined;
    set<TActionResult>(
        key: ActionFunc<TPrevResult, TActionResult>,
        value: ActionParser<TPrevResult, TActionResult>,
    ): this;
}

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

        const cachedParser = this.__getCachedParser();
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

    private __getCachedParser():
        | ActionParser<TPrevResult, TActionResult>
        | undefined {
        let parserCacheMapLv1 = parserCacheMap.get(this.__prevParser);
        if (!parserCacheMapLv1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parserCacheMapLv1 = new WeakMap<any, any>();
            parserCacheMap.set(this.__prevParser, parserCacheMapLv1);
        }

        const cachedParser = parserCacheMapLv1.get(this.__actionFn);
        if (!cachedParser) {
            parserCacheMapLv1.set(this.__actionFn, this);
        }

        return cachedParser;
    }
}
