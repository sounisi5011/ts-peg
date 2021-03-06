export type ParseResult<TResult> =
    | ParseSuccessResult<TResult>
    | ParseFailureResult;

export interface ParseResultInterface {
    allowCache: boolean;
}

export class ParseSuccessResult<TResult> implements ParseResultInterface {
    readonly offsetEnd: number;
    readonly allowCache: boolean;
    private readonly __dataGenerator: () => TResult;

    constructor(options: {
        offsetEnd: number;
        dataGenerator: () => TResult;
        allowCache: boolean;
    }) {
        this.offsetEnd = options.offsetEnd;
        this.allowCache = options.allowCache;
        this.__dataGenerator = options.dataGenerator;
    }

    get data(): TResult {
        return this.__dataGenerator();
    }

    clone(newOptions: {
        offsetEnd?: number;
        allowCache?: boolean;
    }): ParseSuccessResult<TResult>;

    clone<TNewResult>(newOptions: {
        offsetEnd?: number;
        dataGenerator: () => TNewResult;
        allowCache?: boolean;
    }): ParseSuccessResult<TNewResult>;

    clone(
        newOptions: {
            offsetEnd?: number;
            dataGenerator?: () => unknown;
            allowCache?: boolean;
        } = {},
    ): ParseSuccessResult<unknown> {
        return new ParseSuccessResult<unknown>({
            offsetEnd: this.offsetEnd,
            dataGenerator: this.__dataGenerator,
            allowCache: this.allowCache,
            ...newOptions,
        });
    }
}

export class ParseFailureResult implements ParseResultInterface {
    readonly allowCache: boolean;

    constructor(options: { allowCache: boolean }) {
        this.allowCache = options.allowCache;
    }
}
