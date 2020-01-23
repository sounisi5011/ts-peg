import {
    PredicateExecutionEnvironment,
    ValueConverter,
    ValueConverterMetadata,
} from '../internal';

export type ActionFunc<TPrevResult, TActionResult> = (
    exp: TPrevResult,
    envs: ActionExecutionEnvironment,
) => TActionResult;

export class ActionExecutionEnvironment extends PredicateExecutionEnvironment {
    readonly range: readonly [number, number];

    constructor(
        input: string,
        options: { offsetStart: number; offsetEnd: number },
    ) {
        const { offsetEnd, ...superOpts } = options;
        super(input, superOpts);
        this.range = [this.offset, offsetEnd];
    }

    get text(): string {
        return this.input.substring(...this.range);
    }
}

export class ActionParser<TPrevResult, TActionResult> extends ValueConverter<
    TPrevResult,
    ActionFunc<TPrevResult, TActionResult>,
    TActionResult
> {
    protected __valueConverter(
        value: ActionFunc<TPrevResult, TActionResult>,
        { input, offsetStart, result }: ValueConverterMetadata<TPrevResult>,
    ): TActionResult {
        return value(
            result.data,
            new ActionExecutionEnvironment(input, {
                offsetStart,
                offsetEnd: result.offsetEnd,
            }),
        );
    }
}
