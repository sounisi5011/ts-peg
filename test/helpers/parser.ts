import { Parser, ParseSuccessResult } from '../../src';

export function parse<TResult>(
    parser: Parser<TResult>,
    input: string,
    offsetStart: number = 0,
    stopOffset: number = Infinity,
): { offsetEnd: number; data: TResult } | undefined {
    const result = parser.tryParse(input, offsetStart, stopOffset);
    if (result instanceof ParseSuccessResult) {
        return {
            offsetEnd: result.offsetEnd,
            get data(): TResult {
                return (result as ParseSuccessResult<TResult>).data;
            },
        };
    }
    return undefined;
}
