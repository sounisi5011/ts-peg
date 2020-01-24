import { ValueConverter } from '../../internal';

export class ValueConverterParser<
    TPrevResult,
    TConvertedResult
> extends ValueConverter<TPrevResult, TConvertedResult, TConvertedResult> {
    protected __valueConverter(value: TConvertedResult): TConvertedResult {
        return value;
    }
}
