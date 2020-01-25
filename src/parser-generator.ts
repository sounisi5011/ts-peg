import {
    AnyCharacterParser,
    CharacterClassParser,
    CustomizableParser,
    LiteralStringParser,
    Parser,
    ParserLike,
    ParserResultDataType,
    PrioritizedChoiceParser,
    SequenceParser,
} from './internal';
import { OneOrMoreReadonlyTuple, OneOrMoreTuple } from './types';

type ParserLike2Result<T extends ParserLike> = T extends Parser<unknown>
    ? ParserResultDataType<T>
    : T;
type ParserTuple2ResultTuple<T extends readonly ParserLike[]> = {
    -readonly [P in keyof T]: T[P] extends ParserLike
        ? ParserLike2Result<T[P]>
        : T[P];
};

export class ParserGenerator {
    get any(): AnyCharacterParser {
        return new AnyCharacterParser(this);
    }

    str<T extends string>(str: T): LiteralStringParser<T> {
        return new LiteralStringParser(str, this);
    }

    range(str1: string, str2: string): Parser<string> {
        const codePoint1 = str1.codePointAt(0);
        if (typeof codePoint1 !== 'number') {
            throw new TypeError(
                'first argument must be a single character string value',
            );
        }
        const codePoint2 = str2.codePointAt(0);
        if (typeof codePoint2 !== 'number') {
            throw new TypeError(
                'first argument must be a single character string value',
            );
        }
        const minCodePoint = Math.min(codePoint1, codePoint2);
        const maxCodePoint = Math.max(codePoint1, codePoint2);

        // TODO: Rewrite to code that does not use CustomizableParser
        return new CustomizableParser((input, offsetStart) => {
            const currentCodePoint = input.codePointAt(offsetStart);
            if (
                typeof currentCodePoint === 'number' &&
                minCodePoint <= currentCodePoint &&
                currentCodePoint <= maxCodePoint
            ) {
                const currentChar = String.fromCodePoint(currentCodePoint);
                return {
                    offsetEnd: offsetStart + currentChar.length,
                    valueGetter: () => currentChar,
                };
            }
            return undefined;
        }, this);
    }

    chars(chars: string): CharacterClassParser {
        return new CharacterClassParser(chars, this);
    }

    zeroOrMore<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T>[]> {
        return this.seq(...args).zeroOrMore;
    }

    oneOrMore<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<OneOrMoreTuple<ParserTuple2ResultTuple<T>>> {
        return this.seq(...args).oneOrMore;
    }

    optional<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserTuple2ResultTuple<T> | undefined> {
        return this.seq(...args).optional;
    }

    followedBy<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<undefined> {
        const exp = this.seq(...args);
        // TODO: Rewrite to code that does not use CustomizableParser
        return new CustomizableParser(
            (input, offsetStart) =>
                exp.tryParse(input, offsetStart)
                    ? { offsetEnd: offsetStart, valueGetter: () => undefined }
                    : undefined,
            this,
        );
    }

    notFollowedBy<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<undefined> {
        const exp = this.seq(...args);
        // TODO: Rewrite to code that does not use CustomizableParser
        return new CustomizableParser(
            (input, offsetStart) =>
                exp.tryParse(input, offsetStart)
                    ? undefined
                    : { offsetEnd: offsetStart, valueGetter: () => undefined },
            this,
        );
    }

    seq<T extends readonly [ParserLike, ...ParserLike[]]>(
        ...args: T | [() => T]
    ): SequenceParser<T> {
        return new SequenceParser(this, this.__validateSequenceLikeArgs(args));
    }

    or<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): Parser<ParserLike2Result<T[number]>> {
        return new PrioritizedChoiceParser(
            this,
            this.__validateSequenceLikeArgs(args),
        );
    }

    /** @TODO */
    label(_label: string): ParserGenerator {
        return this;
    }

    private __validateSequenceLikeArgs<
        T extends OneOrMoreReadonlyTuple<ParserLike>
    >(args: T | [() => T]): T | (() => T) {
        if (args.length < 1) {
            throw new Error('one or more arguments are required');
        }
        const [headArg, ...tailArgs] = args;
        if (typeof headArg === 'function' && !(headArg instanceof Parser)) {
            if (tailArgs.length >= 1) {
                throw new Error(
                    'the second and subsequent arguments cannot be specified. the first argument is the callback function',
                );
            }
            return headArg;
        }
        if (!SequenceParser.isValidExpressions([headArg])) {
            throw new TypeError(
                'only the Parser object, string or function can be specified as the first argument',
            );
        }
        if (!SequenceParser.isValidExpressions(args)) {
            throw new TypeError(
                'only the Parser object or string can be specified for the second argument and the subsequent arguments',
            );
        }
        return args;
    }
}
