export function* matchAll(
    str: string,
    regexp: RegExp,
): Generator<RegExpExecArray, void> {
    let match;
    while ((match = regexp.exec(str))) {
        yield match;
    }
}
