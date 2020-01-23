import { Parser, ParseResult } from '../internal';
import { CacheStore } from '../utils/cache-store';

const parserCache = new CacheStore<
    [Parser<unknown>, unknown],
    ValueConverterParser<unknown, unknown>
>();

export class ValueConverterParser<TPrevResult, TConvertedResult> extends Parser<
    TConvertedResult
> {
    private readonly __prevParser: Parser<TPrevResult>;
    private readonly __value: TConvertedResult;

    constructor(prevParser: Parser<TPrevResult>, value: TConvertedResult) {
        super(prevParser.parserGenerator);
        this.__prevParser = prevParser;
        this.__value = value;

        const cachedParser = parserCache.getWithTypeGuard(
            [prevParser, value],
            (
                value,
            ): value is ValueConverterParser<TPrevResult, TConvertedResult> =>
                value instanceof this.constructor,
            this,
        );
        if (cachedParser) return cachedParser;
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TConvertedResult> {
        const result = this.__prevParser.tryParse(input, offsetStart);
        if (!result) return undefined;
        return { ...result, data: this.__value };
    }
}
