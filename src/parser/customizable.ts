import {
    ParseFunc,
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../internal';

export type CustomizableParserParseFunc<TResult> = ParseFunc<
    TResult,
    | ParseSuccessResult<TResult>
    | { offsetEnd: number; valueGetter(): TResult }
    | undefined
>;

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
    ): ParseResult<TResult> {
        const result = this.__parseFunc(input, offsetStart);
        return result
            ? result instanceof ParseSuccessResult
                ? result
                : new ParseSuccessResult(result.offsetEnd, result.valueGetter)
            : result;
    }
}
