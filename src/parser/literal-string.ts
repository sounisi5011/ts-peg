import { ParserGenerator } from '../parser-generator';
import { Parser } from '.';

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
    constructor(literalString: T, parserGenerator: ParserGenerator) {
        if (typeof literalString !== 'string') {
            throw new TypeError('first argument must be a string');
        }

        super((input, offsetStart) =>
            input.startsWith(literalString, offsetStart)
                ? {
                      offsetEnd: offsetStart + literalString.length,
                      data: literalString,
                  }
                : undefined,
        );

        let parserCacheMap = LiteralStringParserCacheMap.get(parserGenerator);
        if (!parserCacheMap) {
            parserCacheMap = new Map();
            LiteralStringParserCacheMap.set(parserGenerator, parserCacheMap);
        }

        const cachedParser = parserCacheMap.get(literalString);
        if (cachedParser) return cachedParser;
        parserCacheMap.set(literalString, this);
    }
}
