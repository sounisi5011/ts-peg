export function hasProperty<TObj, TProp extends PropertyKey>(
    object: TObj,
    property: TProp,
): object is TObj &
    (TProp extends keyof TObj
        ? Required<Pick<TObj, TProp>>
        : { [P in TProp]: unknown }) {
    return Object.prototype.hasOwnProperty.call(object, property);
}

export function* matchAll(
    str: string,
    regexp: RegExp,
): Generator<RegExpExecArray, void> {
    let match;
    while ((match = regexp.exec(str))) {
        yield match;
    }
}
