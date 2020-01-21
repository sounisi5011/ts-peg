import { Parser, ParseResult, ParserGenerator } from '../internal';

interface LiteralStringParserMapType
    extends Map<string, LiteralStringParser<string>> {
    get<T extends string>(key: T): LiteralStringParser<T> | undefined;
    set<T extends string>(key: T, value: LiteralStringParser<T>): this;
}

const LiteralStringParserCacheMap = new WeakMap<
    ParserGenerator,
    LiteralStringParserMapType
>();

export class LiteralStringParser<T extends string> extends Parser<T> {
    private readonly __literalString: T;

    constructor(literalString: T, parserGenerator: ParserGenerator) {
        if (typeof literalString !== 'string') {
            throw new TypeError('first argument must be a string');
        }

        super(parserGenerator);
        this.__literalString = literalString;

        let parserCacheMap = LiteralStringParserCacheMap.get(parserGenerator);
        if (!parserCacheMap) {
            parserCacheMap = new Map();
            LiteralStringParserCacheMap.set(parserGenerator, parserCacheMap);
        }

        const cachedParser = parserCacheMap.get(literalString);
        if (cachedParser) return cachedParser;
        parserCacheMap.set(literalString, this);
    }

    protected __parse(input: string, offsetStart: number): ParseResult<T> {
        return input.startsWith(this.__literalString, offsetStart)
            ? {
                  offsetEnd: offsetStart + this.__literalString.length,
                  data: this.__literalString,
              }
            : undefined;
    }
}
