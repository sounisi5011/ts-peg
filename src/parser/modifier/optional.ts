import { ConverterParser, Parser, ParseSuccessResult } from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const parserCache = new CacheStore<
    [Function, Parser<unknown>],
    OptionalParser<unknown>
>();

export class OptionalParser<TResult> extends ConverterParser<
    TResult | undefined
> {
    constructor(prevParser: Parser<TResult>) {
        super(prevParser);

        const cachedParser = parserCache.upsertWithTypeGuard(
            [this.constructor, prevParser],
            undefined,
            () => this,
            (value): value is OptionalParser<TResult> =>
                value instanceof this.constructor,
        );
        if (cachedParser && cachedParser !== this) return cachedParser;
    }

    protected __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseSuccessResult<TResult | undefined> {
        const result = this.__prevParser.tryParse(
            input,
            offsetStart,
            stopOffset,
        );
        return result
            ? new ParseSuccessResult(result.offsetEnd, () => result.data)
            : new ParseSuccessResult(offsetStart, () => undefined);
    }
}
