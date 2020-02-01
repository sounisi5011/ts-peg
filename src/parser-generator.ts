import { unicodeVersion } from './case-folding-map';
import {
    AnyCharacterParser,
    CharacterClassParser,
    isParserLike,
    isParserLikeList,
    LiteralStringParser,
    Parser,
    ParserLike,
    PredicateFunc,
    PredicateParser,
    PrioritizedChoiceParser,
    RegExpParser,
    SequenceParser,
} from './internal';
import { OneOrMoreReadonlyTuple, OneOrMoreTuple } from './types';

export class ParserGenerator {
    public readonly unicodeVersion = unicodeVersion;

    get any(): AnyCharacterParser {
        return new AnyCharacterParser(this);
    }

    str<T extends string>(str: T): LiteralStringParser<T> {
        return new LiteralStringParser(str, this);
    }

    chars(chars: string): CharacterClassParser {
        return CharacterClassParser.fromPattern(this, chars);
    }

    re(pattern: RegExp): RegExpParser {
        if (arguments.length < 1) throw new Error('one argument required');
        return new RegExpParser(this, pattern, {
            errorMessage: {
                patternType:
                    'only the RegExp object can be specified as argument',
            },
        });
    }

    // eslint-disable-next-line @typescript-eslint/camelcase
    is_a(
        predicate: ParserLike | (() => Parser<unknown>) | PredicateFunc,
    ): PredicateParser {
        return this.__genPredicateParser(arguments.length, predicate, false);
    }

    // eslint-disable-next-line @typescript-eslint/camelcase
    not_a(
        predicate: ParserLike | (() => Parser<unknown>) | PredicateFunc,
    ): PredicateParser {
        return this.__genPredicateParser(arguments.length, predicate, true);
    }

    seq<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        arg: () => T,
    ): SequenceParser<T>;

    seq<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T
    ): SequenceParser<T>;

    seq(
        arg: ParserLike | (() => OneOrMoreReadonlyTuple<ParserLike>),
        ...args: ParserLike[]
    ): SequenceParser<OneOrMoreReadonlyTuple<ParserLike>> {
        return new SequenceParser(
            this,
            this.__validateSequenceLikeArgs(arguments.length, arg, args),
        );
    }

    or<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        arg: () => T,
    ): PrioritizedChoiceParser<T>;

    or<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T
    ): PrioritizedChoiceParser<T>;

    or(
        arg: ParserLike | (() => OneOrMoreReadonlyTuple<ParserLike>),
        ...args: ParserLike[]
    ): PrioritizedChoiceParser<OneOrMoreReadonlyTuple<ParserLike>> {
        return new PrioritizedChoiceParser(
            this,
            this.__validateSequenceLikeArgs(arguments.length, arg, args),
        );
    }

    private __genPredicateParser(
        argsLen: number,
        predicate: ParserLike | (() => Parser<unknown>) | PredicateFunc,
        negative: boolean,
    ): PredicateParser {
        if (argsLen < 1) throw new Error('one argument required');
        return new PredicateParser({
            parserGenerator: this,
            predicate,
            negative,
            errorMessage: {
                predicateType: message =>
                    message.replace(
                        /can be specified for the predicate option$/,
                        'can be specified as argument',
                    ),
            },
        });
    }

    private __validateSequenceLikeArgs(
        argsLen: number,
        headArg: ParserLike | (() => OneOrMoreReadonlyTuple<ParserLike>),
        tailArgs: ParserLike[],
    ): OneOrMoreTuple<ParserLike> | (() => OneOrMoreReadonlyTuple<ParserLike>) {
        if (argsLen < 1) {
            throw new Error('one or more arguments are required');
        }

        if (typeof headArg === 'function' && !(headArg instanceof Parser)) {
            if (tailArgs.length >= 1) {
                throw new Error(
                    'the second and subsequent arguments cannot be specified. the first argument is the callback function',
                );
            }
            return headArg;
        }

        if (!isParserLike(headArg)) {
            throw new TypeError(
                'only the following values can be specified as the first argument: Parser object, string, RegExp, or function',
            );
        }
        if (!isParserLikeList(tailArgs)) {
            throw new TypeError(
                'for the second and subsequent arguments, only the following values can be specified: Parser object or string or RegExp',
            );
        }
        return [headArg, ...tailArgs];
    }
}

export interface ParserGenerator {
    regexp: ParserGenerator['re'];
    regex: ParserGenerator['re'];
}
ParserGenerator.prototype.regexp = ParserGenerator.prototype.regex =
    ParserGenerator.prototype.re;
