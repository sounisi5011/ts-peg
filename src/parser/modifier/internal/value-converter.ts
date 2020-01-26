import {
    ConverterParser,
    Parser,
    ParseResult,
    ParseSuccessResult,
} from '../../../internal';
import { CacheStore } from '../../../utils/cache-store';

const parserCache = new CacheStore<
    [Function, Parser<unknown>, unknown],
    ValueConverter<unknown, unknown, unknown>
>();

export interface ValueConverterMetadata<TPrevResult> {
    input: string;
    offsetStart: number;
    result: Exclude<ParseResult<TPrevResult>, undefined>;
}

export abstract class ValueConverter<
    TPrevResult,
    TValue,
    TConvertedResult
> extends ConverterParser<TPrevResult, TConvertedResult> {
    protected readonly __value: TValue;

    constructor(prevParser: Parser<TPrevResult>, value: TValue) {
        super(prevParser);
        this.__value = value;

        const cachedParser = parserCache.upsertWithTypeGuard(
            [this.constructor, prevParser, value],
            undefined,
            () => this,
            (
                value,
            ): value is ValueConverter<TPrevResult, TValue, TConvertedResult> =>
                value instanceof this.constructor,
        );
        if (cachedParser !== this) return cachedParser;
    }

    protected abstract __valueConverter(
        value: TValue,
        metadata: ValueConverterMetadata<TPrevResult>,
    ): TConvertedResult;

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TConvertedResult> {
        const result = this.__prevParser.tryParse(input, offsetStart);
        if (!result) return undefined;
        return new ParseSuccessResult(result.offsetEnd, () =>
            this.__valueConverter(this.__value, {
                input,
                offsetStart,
                result,
            }),
        );
    }
}
