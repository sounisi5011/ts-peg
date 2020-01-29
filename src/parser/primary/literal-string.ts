import { canonicalize, unicodeVersion } from '../../case-folding-map';
import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const caseInsensitiveLiteralStringParser = new CacheStore<
    [Function, ParserGenerator, string],
    CaseInsensitiveLiteralStringParser
>();

export class CaseInsensitiveLiteralStringParser extends Parser<string> {
    public readonly unicodeVersion = unicodeVersion;
    private readonly __literalString: string;

    constructor(literalString: string, parserGenerator: ParserGenerator) {
        super(parserGenerator);
        this.__literalString = canonicalize(literalString);

        const cachedParser = caseInsensitiveLiteralStringParser.upsert(
            [this.constructor, parserGenerator, this.__literalString],
            undefined,
            () => this,
        );
        if (cachedParser !== this) return cachedParser;
    }

    protected __parse(input: string, offsetStart: number): ParseResult<string> {
        const offsetEnd = offsetStart + this.__literalString.length;
        const substr = input.substring(offsetStart, offsetEnd);
        return this.__literalString === canonicalize(substr)
            ? new ParseSuccessResult(offsetEnd, () => substr)
            : undefined;
    }
}

const literalStringParserCache = new CacheStore<
    [Function, ParserGenerator, string],
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
            [this.constructor, parserGenerator, literalString],
            undefined,
            () => this,
            (value): value is LiteralStringParser<T> =>
                value instanceof this.constructor,
        );
        if (cachedParser && cachedParser !== this) return cachedParser;
    }

    get i(): CaseInsensitiveLiteralStringParser {
        return new CaseInsensitiveLiteralStringParser(
            this.__literalString,
            this.parserGenerator,
        );
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
