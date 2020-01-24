import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../../internal';

const anyCharacterParserCacheMap = new WeakMap<
    ParserGenerator,
    AnyCharacterParser
>();

export class AnyCharacterParser extends Parser<string> {
    constructor(parserGenerator: ParserGenerator) {
        super(parserGenerator);
        const cachedParser = anyCharacterParserCacheMap.get(parserGenerator);
        if (cachedParser) return cachedParser;
        anyCharacterParserCacheMap.set(parserGenerator, this);
    }

    protected __parse(input: string, offsetStart: number): ParseResult<string> {
        const codePoint = input.codePointAt(offsetStart);
        if (typeof codePoint === 'number') {
            const data = String.fromCodePoint(codePoint);
            return new ParseSuccessResult(
                offsetStart + data.length,
                () => data,
            );
        }
        return undefined;
    }
}