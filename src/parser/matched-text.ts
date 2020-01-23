import { Parser, ValueConverter, ValueConverterMetadata } from '../internal';

export class MatchedTextParser extends ValueConverter<unknown, null, string> {
    constructor(prevParser: Parser<unknown>) {
        super(prevParser, null);
    }

    protected __valueConverter(
        _value: null,
        {
            input,
            offsetStart,
            result: { offsetEnd },
        }: ValueConverterMetadata<unknown>,
    ): string {
        return input.substring(offsetStart, offsetEnd);
    }
}
