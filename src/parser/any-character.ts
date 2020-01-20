import ParserGenerator from '../parser-generator';
import Parser from '.';

const anyCharacterParserCacheMap = new WeakMap<
    ParserGenerator,
    AnyCharacterParser
>();

export class AnyCharacterParser extends Parser<string> {
    constructor(parserGenerator: ParserGenerator) {
        super((input, offsetStart) => {
            const codePoint = input.codePointAt(offsetStart);
            if (typeof codePoint === 'number') {
                const data = String.fromCodePoint(codePoint);
                return { offsetEnd: offsetStart + data.length, data };
            }
            return undefined;
        });

        const cachedParser = anyCharacterParserCacheMap.get(parserGenerator);
        if (cachedParser) return cachedParser;
        anyCharacterParserCacheMap.set(parserGenerator, this);
    }
}