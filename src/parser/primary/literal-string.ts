import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const caseInsensitiveLiteralStringParser = new CacheStore<
    [Function, ParserGenerator, number],
    Map<RegExp, CaseInsensitiveLiteralStringParser>
>();

export class CaseInsensitiveLiteralStringParser extends Parser<string> {
    private readonly __literalStringRegExp: RegExp;

    constructor(literalString: string, parserGenerator: ParserGenerator) {
        super(parserGenerator);
        this.__literalStringRegExp = new RegExp(
            literalString.replace(/[$(-+.?[-^{-}]/g, '\\$&'),
            'iuy',
        );

        const cacheMap = caseInsensitiveLiteralStringParser.upsert(
            [this.constructor, parserGenerator, literalString.length],
            undefined,
            () => new Map<RegExp, CaseInsensitiveLiteralStringParser>(),
        );
        for (const [regexp, cachedParser] of cacheMap) {
            regexp.lastIndex = 0;
            const match = regexp.exec(literalString);
            if (match && match[0] === literalString) return cachedParser;
        }
        cacheMap.set(this.__literalStringRegExp, this);
    }

    protected __parse(input: string, offsetStart: number): ParseResult<string> {
        this.__literalStringRegExp.lastIndex = offsetStart;
        const match = this.__literalStringRegExp.exec(input);
        if (match) {
            const matchdText = match[0];
            return new ParseSuccessResult(
                offsetStart + matchdText.length,
                () => matchdText,
            );
        }
        return undefined;
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
