import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const literalStringParserCache = new CacheStore<
    [ParserGenerator, string],
    LiteralStringParser<string>
>();

export class LiteralStringParser<T extends string> extends Parser<T> {
    private readonly __literalString: T;

    constructor(literalString: T, parserGenerator: ParserGenerator) {
        if (typeof literalString !== 'string') {
            throw new TypeError('first argument must be a string');
        }

        super(parserGenerator);
        this.__literalString = literalString;

        const cachedParser = literalStringParserCache.upsertWithTypeGuard(
            [parserGenerator, literalString],
            undefined,
            () => this,
            (value): value is LiteralStringParser<T> =>
                value instanceof this.constructor,
        );
        if (cachedParser !== this) return cachedParser;
    }

    protected __parse(input: string, offsetStart: number): ParseResult<T> {
        return input.startsWith(this.__literalString, offsetStart)
            ? new ParseSuccessResult(
                  offsetStart + this.__literalString.length,
                  () => this.__literalString,
              )
            : undefined;
    }
}
