export type ParseResult<TResult> = ParseSuccessResult<TResult> | undefined;

export class ParseSuccessResult<TResult> {
    private readonly __dataGenerator: () => TResult;

    constructor(readonly offsetEnd: number, dataGenerator: () => TResult) {
        this.__dataGenerator = dataGenerator;
    }

    get data(): TResult {
        return this.__dataGenerator();
    }
}
