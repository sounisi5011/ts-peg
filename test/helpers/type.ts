export type OneOrMoreArray<T> = [T, ...T[]];

export function assertExtendType<
    TExpected,
    _TActual extends TExpected
>(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
