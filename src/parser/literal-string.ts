import { Parser, ParseResult, ParserGenerator } from '../internal';
import { CacheStore } from '../utils/cache-store';

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

        const cachedParser = literalStringParserCache.get(
            [parserGenerator, literalString],
            this,
        );
        if (this.__validateThis(cachedParser)) return cachedParser;
    }

    protected __parse(input: string, offsetStart: number): ParseResult<T> {
        return input.startsWith(this.__literalString, offsetStart)
            ? {
                  offsetEnd: offsetStart + this.__literalString.length,
                  data: this.__literalString,
              }
            : undefined;
    }

    private __validateThis(value: unknown): value is LiteralStringParser<T> {
        return value instanceof this.constructor;
    }
}
