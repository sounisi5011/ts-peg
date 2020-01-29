export function str2codePoints(str: string): string {
    return [...str]
        .map(c =>
            c
                .codePointAt(0)
                ?.toString(16)
                .toUpperCase()
                .padStart(4, '0'),
        )
        .filter((code): code is string => typeof code === 'string')
        .map(code => `U+${code}`)
        .join(' ');
}
