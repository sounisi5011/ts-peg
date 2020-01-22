import { ParseFunc, Parser, ParseResult, ParserGenerator } from '../internal';

export class CustomizableParser<TResult> extends Parser<TResult> {
    private readonly __parseFunc: ParseFunc<TResult>;

    constructor(
        parseFunc: ParseFunc<TResult>,
        parserGenerator: ParserGenerator,
    ) {
        super(parserGenerator);
        this.__parseFunc = parseFunc;
    }

    protected __parse(
        input: string,
        offsetStart: number,
    ): ParseResult<TResult> {
        return this.__parseFunc(input, offsetStart);
    }
}
