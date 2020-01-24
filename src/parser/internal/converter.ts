import { Parser } from '../../internal';

export abstract class ConverterParser<
    TPrevResult,
    TResult = TPrevResult
> extends Parser<TResult> {
    protected readonly __prevParser: Parser<TPrevResult>;

    constructor(prevParser: Parser<TPrevResult>) {
        super(prevParser.parserGenerator);
        this.__prevParser = prevParser;
    }
}
