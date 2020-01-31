import { unicodeVersion } from './case-folding-map';
import {
    AnyCharacterParser,
    CharacterClassParser,
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
import { OneOrMoreReadonlyTuple } from './types';

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
        if (arguments.length < 1) throw new Error('one argument required');
        return this.__convertPredicateParserError(
            () =>
                new PredicateParser({
                    parserGenerator: this,
                    predicate,
                    negative: false,
                }),
        );
    }

    // eslint-disable-next-line @typescript-eslint/camelcase
    not_a(
        predicate: ParserLike | (() => Parser<unknown>) | PredicateFunc,
    ): PredicateParser {
        if (arguments.length < 1) throw new Error('one argument required');
        return this.__convertPredicateParserError(
            () =>
                new PredicateParser({
                    parserGenerator: this,
                    predicate,
                    negative: true,
                }),
        );
    }

    seq<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        arg: () => T,
    ): SequenceParser<T>;

    seq<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T
    ): SequenceParser<T>;

    seq<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): SequenceParser<T> {
        return new SequenceParser(this, this.__validateSequenceLikeArgs(args));
    }

    or<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        arg: () => T,
    ): PrioritizedChoiceParser<T>;

    or<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T
    ): PrioritizedChoiceParser<T>;

    or<T extends OneOrMoreReadonlyTuple<ParserLike>>(
        ...args: T | [() => T]
    ): PrioritizedChoiceParser<T> {
        return new PrioritizedChoiceParser(
            this,
            this.__validateSequenceLikeArgs(args),
        );
    }

    private __validateSequenceLikeArgs<
        T extends OneOrMoreReadonlyTuple<ParserLike>
    >(args: T | [() => T]): T | (() => T) {
        if (args.length < 1)
            throw new Error('one or more arguments are required');

        const [headArg, ...tailArgs] = args;
        if (typeof headArg === 'function' && !(headArg instanceof Parser)) {
            if (tailArgs.length >= 1)
                throw new Error(
                    'the second and subsequent arguments cannot be specified. the first argument is the callback function',
                );
            return headArg;
        }

        this.__validateParserLikeList(args, headArg);
        return args;
    }

    private __validateParserLikeList(
        args: readonly unknown[],
        headArg: unknown,
    ): asserts args is readonly ParserLike[] {
        if (!isParserLikeList([headArg]))
            throw new TypeError(
                'only the Parser object, string or function can be specified as the first argument',
            );
        if (!isParserLikeList(args))
            throw new TypeError(
                'only the Parser object or string can be specified for the second argument and the subsequent arguments',
            );
    }

    private __convertPredicateParserError<T>(func: () => T): T {
        try {
            return func();
        } catch (error) {
            if (
                error instanceof TypeError &&
                error.message ===
                    'only the Parser object, string or function can be specified for the predicate option'
            ) {
                error.message = error.message.replace(
                    /can be specified for the predicate option$/,
                    'can be specified as argument',
                );
                if (error.stack) {
                    error.stack = error.stack.replace(
                        /^(.+) can be specified for the predicate option(?=\n|$)/,
                        '$1 can be specified as argument',
                    );
                }
            }
            throw error;
        }
    }
}
