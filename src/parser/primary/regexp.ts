import {
    ParseFailureResult,
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../../internal';
import { CacheStore } from '../../utils/cache-store';

const parserCache = new CacheStore<
    [Function, ParserGenerator, string],
    RegExpParser
>();

export class RegExpParser extends Parser<string> {
    private readonly __pattern: RegExp;
    private readonly __errorMessage = {
        patternType:
            'only the RegExp object can be specified for the pattern option',
    };

    constructor(
        parserGenerator: ParserGenerator,
        pattern: RegExp,
        {
            errorMessage = {},
        }: { errorMessage?: Partial<Record<'patternType', string>> } = {},
    ) {
        super(parserGenerator);

        Object.assign(this.__errorMessage, errorMessage);
        if (!(pattern instanceof RegExp)) {
            throw new TypeError(this.__errorMessage.patternType);
        }

        this.__pattern = new RegExp(
            pattern,
            pattern.flags.replace(/[gy]+/g, '') + 'y',
        );

        const cachedParser = parserCache.upsert(
            [this.constructor, parserGenerator, this.__pattern.toString()],
            undefined,
            () => this,
        );
        if (cachedParser !== this) return cachedParser;
    }

    protected __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<string> {
        this.__pattern.lastIndex = offsetStart;
        const match = this.__pattern.exec(input);
        if (match) {
            const matchedText = match[0];
            const offsetEnd = offsetStart + matchedText.length;
            if (offsetEnd <= stopOffset) {
                return new ParseSuccessResult({
                    offsetEnd,
                    dataGenerator: () => matchedText,
                    allowCache: true,
                });
            }
        }
        return new ParseFailureResult({ allowCache: true });
    }
}
