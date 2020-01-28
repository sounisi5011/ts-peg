import caseFoldingMap from '../../case-folding-map';
import {
    Parser,
    ParseResult,
    ParserGenerator,
    ParseSuccessResult,
} from '../../internal';
import { isOneOrMoreTuple } from '../../types';
import { filterList, matchAll } from '../../utils';
import { CacheStore } from '../../utils/cache-store';

const characterClassParserCache = new CacheStore<
    [Function, ParserGenerator, string],
    CharacterClassParser
>();

const codePointRangeCache = new CacheStore<
    [Function, number, number],
    CodePointRange
>();

class CodePointRange {
    readonly minCodePoint: number;
    readonly maxCodePoint: number;

    static compare(a: CodePointRange, b: CodePointRange): number {
        const minDiff = a.minCodePoint - b.minCodePoint;
        return minDiff !== 0 ? minDiff : a.maxCodePoint - b.maxCodePoint;
    }

    static merge(
        range1: CodePointRange,
        range2: CodePointRange,
    ): [CodePointRange] | [CodePointRange, CodePointRange] {
        const [minRange, maxRange] = [range1, range2].sort(this.compare);

        if (
            minRange.minCodePoint <= maxRange.minCodePoint &&
            maxRange.maxCodePoint <= minRange.maxCodePoint
        ) {
            return [minRange];
        }

        if (maxRange.minCodePoint <= minRange.maxCodePoint + 1) {
            return [new this(minRange.minCodePoint, maxRange.maxCodePoint)];
        }

        return [minRange, maxRange];
    }

    constructor(codePoint1: number, codePoint2: number = codePoint1) {
        this.minCodePoint = Math.min(codePoint1, codePoint2);
        this.maxCodePoint = Math.max(codePoint1, codePoint2);

        const cachedCodePointRange = codePointRangeCache.upsert(
            [this.constructor, this.minCodePoint, this.maxCodePoint],
            undefined,
            () => this,
        );
        if (cachedCodePointRange !== this) return cachedCodePointRange;
    }

    get length(): number {
        return this.maxCodePoint + 1 - this.minCodePoint;
    }

    has(codePoint: number): boolean {
        return this.minCodePoint <= codePoint && codePoint <= this.maxCodePoint;
    }

    exclude(codePoint: number): CodePointRange[] {
        if (!this.has(codePoint)) return [this];
        return ([
            [this.minCodePoint, codePoint - 1],
            [codePoint + 1, this.maxCodePoint],
        ] as const)
            .filter(([min, max]) => min <= max)
            .map(([min, max]) => new CodePointRange(min, max));
    }

    toString(): string {
        const minChar = String.fromCodePoint(this.minCodePoint);
        if (this.length === 1) {
            return minChar;
        }

        const maxChar = String.fromCodePoint(this.maxCodePoint);
        if (this.length === 2) {
            return `${minChar}${maxChar}`;
        }

        return `${minChar}-${maxChar}`;
    }
}

class CodePointRangeSet implements Iterable<CodePointRange> {
    private __codePointRanges: CodePointRange[] = [];
    private __normalized: boolean = true;
    private __patternCache = new Map<boolean, string>();

    static fromPattern(pattern: string): CodePointRangeSet {
        const codePointRanges = new this();

        for (const match of matchAll(pattern, /(.)(?:-(.))?/gsu)) {
            const [, char1, char2] = match;

            const code1 = char1.codePointAt(0);
            if (typeof code1 !== 'number') continue;

            const code2 = char2?.codePointAt(0);

            codePointRanges.add(
                typeof code2 === 'number'
                    ? new CodePointRange(code1, code2)
                    : new CodePointRange(code1),
            );
        }

        return codePointRanges;
    }

    constructor(...codePointRanges: CodePointRange[]) {
        if (isOneOrMoreTuple(codePointRanges)) this.add(...codePointRanges);
    }

    get codePointRanges(): Set<CodePointRange> {
        this.__normalizeRanges();
        return new Set(this.__codePointRanges);
    }

    add(...codePointRanges: CodePointRange[]): this {
        this.__normalized = false;
        this.__codePointRanges.push(...codePointRanges);
        return this;
    }

    includes(codePoint: number): boolean {
        return this.__codePointRanges.some(codePointRange =>
            codePointRange.has(codePoint),
        );
    }

    toPattern(isInverse = false): string {
        const cachedPattern = this.__patternCache.get(isInverse);
        if (this.__normalized && typeof cachedPattern === 'string') {
            return cachedPattern;
        }

        this.__normalizeRanges();

        const codePointRanges: CodePointRange[] = [];
        let appendSecond: CodePointRange | undefined;
        let appendAfterRangeOrEnd: CodePointRange | undefined;

        for (const [
            index,
            codePointRange,
        ] of this.__splitTwoCharsCodePointRanges(
            this.__codePointRanges,
        ).entries()) {
            const { minCodePoint } = codePointRange;

            if (!isInverse && index === 0 && minCodePoint === 0x005e) {
                codePointRanges.push(
                    ...this.__splitTwoCharsCodePointRanges(
                        codePointRange.exclude(minCodePoint),
                    ),
                );
                appendSecond = new CodePointRange(minCodePoint);
            } else if (
                index !== 0 &&
                codePointRange === new CodePointRange(0x002d)
            ) {
                appendAfterRangeOrEnd = codePointRange;
            } else {
                codePointRanges.push(codePointRange);
            }

            if (appendSecond && codePointRanges.length >= 1) {
                codePointRanges.splice(1, 0, appendSecond);
                appendSecond = undefined;
            }

            if (appendAfterRangeOrEnd) {
                const lastCodePointRange =
                    codePointRanges[codePointRanges.length - 1];
                const isAfterRange = lastCodePointRange.length >= 3;
                if (isAfterRange) {
                    codePointRanges.push(appendAfterRangeOrEnd);
                    appendAfterRangeOrEnd = undefined;
                }
            }
        }
        if (appendAfterRangeOrEnd) {
            codePointRanges.push(appendAfterRangeOrEnd);
        }

        const pattern =
            (isInverse ? '^' : '') +
            this.__moveSurrogateCharCodes(codePointRanges).join('');
        this.__patternCache.set(isInverse, pattern);

        return pattern;
    }

    [Symbol.iterator](): Iterator<CodePointRange> {
        this.__normalizeRanges();
        return this.__codePointRanges[Symbol.iterator]();
    }

    private __normalizeRanges(): void {
        if (!this.__normalized) {
            this.__codePointRanges = this.__codePointRanges
                .sort(CodePointRange.compare)
                .reduce<CodePointRange[]>((rangeList, range) => {
                    const prevRange = rangeList.pop();
                    if (!prevRange) return [range];
                    return [
                        ...rangeList,
                        ...CodePointRange.merge(prevRange, range),
                    ];
                }, []);
            this.__normalized = true;
        }
    }

    /**
     * [ CodePointRange<U+0021 - U+0022> ] -> [ CodePointRange<U+0021>, CodePointRange<U+0022> ]
     */
    private __splitTwoCharsCodePointRanges(
        codePointRanges: CodePointRange[],
    ): CodePointRange[] {
        return codePointRanges.reduce<CodePointRange[]>(
            (codePointRangesList, codePointRange) =>
                codePointRange.length === 2
                    ? [
                          ...codePointRangesList,
                          new CodePointRange(codePointRange.minCodePoint),
                          new CodePointRange(codePointRange.maxCodePoint),
                      ]
                    : [...codePointRangesList, codePointRange],
            [],
        );
    }

    /**
     * [ CodePointRange<U+D800 - U+DBFF>, CodePointRange<U+DC00 - U+DFFF> ] -> [ CodePointRange<U+DC00 - U+DFFF>, CodePointRange<U+D800 - U+DBFF> ]
     */
    private __moveSurrogateCharCodes(
        codePointRanges: CodePointRange[],
    ): CodePointRange[] {
        const {
            filtered: lowSurrogateCodePointRanges,
            excludeFiltered: newCodePointRanges,
        } = filterList(codePointRanges, codePointRange =>
            this.__isLowSurrogate(codePointRange.minCodePoint),
        );

        if (lowSurrogateCodePointRanges.length < 1) return codePointRanges;

        const highSurrogateStartPos = newCodePointRanges.findIndex(
            codePointRange =>
                this.__isHighSurrogate(codePointRange.maxCodePoint),
        );
        if (highSurrogateStartPos < 0) return codePointRanges;

        newCodePointRanges.splice(
            highSurrogateStartPos,
            0,
            ...lowSurrogateCodePointRanges,
        );
        return newCodePointRanges;
    }

    private __isHighSurrogate(codePoint: number): boolean {
        return codePoint >= 0xd800 && codePoint <= 0xdbff;
    }

    private __isLowSurrogate(codePoint: number): boolean {
        return codePoint >= 0xdc00 && codePoint <= 0xdfff;
    }
}

export class CharacterClassParser extends Parser<string> {
    readonly isInverse: boolean;
    private readonly __codePointRanges: CodePointRangeSet;

    constructor(charactersPattern: string, parserGenerator: ParserGenerator) {
        super(parserGenerator);

        this.isInverse = charactersPattern.startsWith('^');
        this.__codePointRanges = CodePointRangeSet.fromPattern(
            this.isInverse ? charactersPattern.substring(1) : charactersPattern,
        );

        const cachedParser = characterClassParserCache.upsert(
            [this.constructor, parserGenerator, this.pattern],
            undefined,
            () => this,
        );
        if (cachedParser !== this) return cachedParser;
    }

    get i(): CharacterClassParser {
        const newCodePointRanges = new CodePointRangeSet();
        for (const codePointRange of this.__codePointRanges) {
            newCodePointRanges.add(codePointRange);
            for (const [caseFoldingTargetCode, { codes }] of caseFoldingMap) {
                if (codePointRange.has(caseFoldingTargetCode)) {
                    newCodePointRanges.add(
                        ...codes.map(
                            mappingCode => new CodePointRange(mappingCode),
                        ),
                    );
                }
            }
        }
        return new CharacterClassParser(
            newCodePointRanges.toPattern(this.isInverse),
            this.parserGenerator,
        );
    }

    get pattern(): string {
        return this.__codePointRanges.toPattern(this.isInverse);
    }

    isMatch(str: string, position = 0): string | null {
        const codePoint = str.codePointAt(position);
        if (typeof codePoint !== 'number') return null;

        if (this.__codePointRanges.includes(codePoint)) {
            return !this.isInverse ? String.fromCodePoint(codePoint) : null;
        }

        if (!this.isInverse) {
            const charCode = str.charCodeAt(position);
            if (
                typeof charCode === 'number' &&
                this.__codePointRanges.includes(charCode)
            ) {
                return String.fromCodePoint(charCode);
            }
        }

        return !this.isInverse ? null : String.fromCodePoint(codePoint);
    }

    protected __parse(input: string, offsetStart: number): ParseResult<string> {
        const matchChar = this.isMatch(input, offsetStart);
        return matchChar
            ? new ParseSuccessResult(
                  offsetStart + matchChar.length,
                  () => matchChar,
              )
            : undefined;
    }
}
