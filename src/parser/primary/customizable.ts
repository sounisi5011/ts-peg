import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../../internal';

export type CustomizableParserParseFunc<TResult> = (
    input: string,
    offsetStart: number,
    stopOffset: number,
) =>
    | ParseSuccessResult<TResult>
    | { offsetEnd: number; valueGetter(): TResult }
    | undefined;

export class CustomizableParser<TResult> extends Parser<TResult> {
    private readonly __parseFunc: CustomizableParserParseFunc<TResult>;

    constructor(
        parseFunc: CustomizableParserParseFunc<TResult>,
        parserGenerator: ParserGenerator,
    ) {
        super(parserGenerator);
        this.__parseFunc = parseFunc;
    }

    protected __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<TResult> {
        const result = this.__parseFunc(input, offsetStart, stopOffset);
        if (result) {
            if (result.offsetEnd <= stopOffset) {
                return result instanceof ParseSuccessResult
                    ? result
                    : new ParseSuccessResult(
                          result.offsetEnd,
                          result.valueGetter,
                      );
            }
        }
        return undefined;
    }
}
