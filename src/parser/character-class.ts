import ParserGenerator from '../parser-generator';
import Parser from '.';

const characterClassParserCacheMap = new WeakMap<
    ParserGenerator,
    Map<string, CharacterClassParser>
>();

interface CodePointRange {
    minCodePoint: number;
    maxCodePoint: number;
}

export default class CharacterClassParser extends Parser<string> {
    readonly isInverse: boolean;
    private readonly __codePointRanges: CodePointRange[];

    constructor(charactersPattern: string, parserGenerator: ParserGenerator) {
        super((input, offsetStart) => {
            const matchChar = this.isMatch(
                input.substring(offsetStart, offsetStart + 2),
            );
            return matchChar
                ? { offsetEnd: offsetStart + matchChar.length, data: matchChar }
                : undefined;
        });

        this.isInverse = charactersPattern.startsWith('^');
        this.__codePointRanges = this.__pattern2ranges(
            this.isInverse ? charactersPattern.substring(1) : charactersPattern,
        );

        let parserCacheMap = characterClassParserCacheMap.get(parserGenerator);
        if (!parserCacheMap) {
            parserCacheMap = new Map();
            characterClassParserCacheMap.set(parserGenerator, parserCacheMap);
        }

        const pattern = this.pattern;
        const cachedParser = parserCacheMap.get(pattern);
        if (cachedParser) return cachedParser;
        parserCacheMap.set(pattern, this);
    }

    get pattern(): string {
        return (
            (this.isInverse ? '^' : '') +
            this.__normalizeCodePointRanges(this.__codePointRanges)
                .reduce(
                    (state, codePointRange, index, codePointRanges) => {
                        const { minCodePoint, maxCodePoint } = codePointRange;
                        let insertCodePointRange = true;

                        if (
                            index === 0 &&
                            !this.isInverse &&
                            minCodePoint === 0x005e
                        ) {
                            state.codePointRanges.push(
                                ...this.__normalizeCodePointRanges([
                                    {
                                        ...codePointRange,
                                        minCodePoint: minCodePoint + 1,
                                    },
                                ]),
                            );
                            state.appendSecond = {
                                minCodePoint: minCodePoint,
                                maxCodePoint: minCodePoint,
                            };
                            insertCodePointRange = false;
                        }

                        if (
                            index !== 0 &&
                            minCodePoint === maxCodePoint &&
                            minCodePoint === 0x002d
                        ) {
                            state.appendAfterRangeOrEnd = codePointRange;
                            insertCodePointRange = false;
                        }

                        if (insertCodePointRange) {
                            state.codePointRanges.push(codePointRange);
                        }
                        if (
                            state.appendSecond &&
                            state.codePointRanges.length >= 1
                        ) {
                            state.codePointRanges.splice(
                                1,
                                0,
                                state.appendSecond,
                            );
                            state.appendSecond = null;
                        }
                        if (state.appendAfterRangeOrEnd) {
                            const lastCodePointRange =
                                state.codePointRanges[
                                    state.codePointRanges.length - 1
                                ];
                            const isAfterRange =
                                lastCodePointRange.maxCodePoint -
                                    lastCodePointRange.minCodePoint >=
                                2;
                            const isEnd = index === codePointRanges.length - 1;
                            if (isAfterRange || isEnd) {
                                state.codePointRanges.push(
                                    state.appendAfterRangeOrEnd,
                                );
                                state.appendAfterRangeOrEnd = null;
                            }
                        }

                        return state;
                    },
                    {
                        codePointRanges: [] as CodePointRange[],
                        appendSecond: null as CodePointRange | null,
                        appendAfterRangeOrEnd: null as CodePointRange | null,
                    },
                )
                .codePointRanges.map(({ minCodePoint, maxCodePoint }) => {
                    const minChar = String.fromCodePoint(minCodePoint);
                    if (minCodePoint === maxCodePoint) {
                        return minChar;
                    }

                    const maxChar = String.fromCodePoint(maxCodePoint);
                    if (maxCodePoint - minCodePoint === 1) {
                        return `${minChar}${maxChar}`;
                    }

                    return `${minChar}-${maxChar}`;
                })
                .join('')
        );
    }

    isMatch(char: string): string | null {
        const codePoint = char.codePointAt(0);
        if (typeof codePoint !== 'number') return null;

        if (
            this.__codePointRanges.some(
                ({ minCodePoint, maxCodePoint }) =>
                    minCodePoint <= codePoint && codePoint <= maxCodePoint,
            )
        ) {
            return !this.isInverse ? String.fromCodePoint(codePoint) : null;
        }

        if (!this.isInverse) {
            const charCode = char.charCodeAt(0);
            if (typeof charCode === 'number') {
                if (
                    this.__codePointRanges.some(
                        ({ minCodePoint, maxCodePoint }) =>
                            minCodePoint <= charCode &&
                            charCode <= maxCodePoint,
                    )
                ) {
                    return String.fromCodePoint(charCode);
                }
            }
        }

        return !this.isInverse ? null : String.fromCodePoint(codePoint);
    }

    private __pattern2ranges(pattern: string): CodePointRange[] {
        const codePointRanges: CodePointRange[] = [];
        const patternRegExp = /(.)-(.)|(.)/gsu;

        let match;
        while ((match = patternRegExp.exec(pattern))) {
            const [, char1, char2, singleChar] = match;
            if (singleChar) {
                const code = singleChar.codePointAt(0);
                if (typeof code === 'number') {
                    codePointRanges.push({
                        minCodePoint: code,
                        maxCodePoint: code,
                    });
                }
            } else {
                const code1 = char1.codePointAt(0);
                const code2 = char2.codePointAt(0);
                if (typeof code1 === 'number' && typeof code2 === 'number') {
                    codePointRanges.push({
                        minCodePoint: Math.min(code1, code2),
                        maxCodePoint: Math.max(code1, code2),
                    });
                }
            }
        }

        return codePointRanges
            .sort((a, b) => {
                const minDiff = a.minCodePoint - b.minCodePoint;
                return minDiff !== 0
                    ? minDiff
                    : a.maxCodePoint - b.maxCodePoint;
            })
            .reduce<typeof codePointRanges>((rangeList, range) => {
                const prevRange = rangeList.pop();
                if (!prevRange) return [range];

                if (
                    prevRange.minCodePoint <= range.minCodePoint &&
                    range.maxCodePoint <= prevRange.maxCodePoint
                ) {
                    return [...rangeList, prevRange];
                }

                if (range.minCodePoint <= prevRange.maxCodePoint + 1) {
                    return [
                        ...rangeList,
                        {
                            minCodePoint: prevRange.minCodePoint,
                            maxCodePoint: range.maxCodePoint,
                        },
                    ];
                }

                return [...rangeList, prevRange, range];
            }, []);
    }

    private __normalizeCodePointRanges(
        codePointRanges: CodePointRange[],
    ): CodePointRange[] {
        return codePointRanges.reduce<CodePointRange[]>(
            (codePointRangesList, codePointRange) => {
                const { minCodePoint, maxCodePoint } = codePointRange;
                const newCodePointRangesList =
                    minCodePoint + 1 === maxCodePoint
                        ? [minCodePoint, maxCodePoint].map(codePoint => ({
                              minCodePoint: codePoint,
                              maxCodePoint: codePoint,
                          }))
                        : [codePointRange];
                return [
                    ...codePointRangesList,
                    ...newCodePointRangesList,
                ].filter(
                    ({ minCodePoint, maxCodePoint }) =>
                        minCodePoint <= maxCodePoint,
                );
            },
            [],
        );
    }
}
