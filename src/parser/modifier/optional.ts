import { ConverterParser, Parser, ParseSuccessResult } from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const parserCache = new CacheStore<
    [Parser<unknown>],
    OptionalParser<unknown>
>();

export class OptionalParser<TResult> extends ConverterParser<
    TResult | undefined
> {
    constructor(prevParser: Parser<TResult>) {
        super(prevParser);

        const cachedParser = parserCache.getWithTypeGuard(
            [prevParser],
            (value): value is OptionalParser<TResult> =>
                value instanceof this.constructor,
            this,
        );
        if (cachedParser) return cachedParser;
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseSuccessResult<TResult | undefined> {
        const result = this.__prevParser.tryParse(input, offsetStart);
        return result
            ? new ParseSuccessResult(result.offsetEnd, () => result.data)
            : new ParseSuccessResult(offsetStart, () => undefined);
    }
}
