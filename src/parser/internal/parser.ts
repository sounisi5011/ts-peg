import {
    ActionFunc,
    ActionParser,
    MatchedTextParser,
    MatchPredicateParser,
    OneOrMoreParser,
    OptionalParser,
    ParseResult,
    ParserGenerator,
    TimesParser,
    ValueConverterParser,
    ZeroOrMoreParser,
} from '../../internal';
import {
    OneOrMoreReadonlyTuple,
    OneOrMoreTuple,
    RepeatTuple,
} from '../../types';
import { CacheStore } from '../../utils/cache-store';

export type ParserResultDataType<T extends Parser<unknown>> = T extends Parser<
    infer U
>
    ? U
    : never;

export abstract class Parser<TResult> {
    private readonly __parserGenerator: ParserGenerator;
    private readonly __memoStore = new CacheStore<
        [string, number, number],
        ParseResult<TResult>
    >();

    constructor(parserGenerator: ParserGenerator) {
        this.__parserGenerator = parserGenerator;
    }

    protected abstract __parse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<TResult>;

    get parserGenerator(): ParserGenerator {
        return this.__parserGenerator;
    }

    get zeroOrMore(): Parser<TResult[]> {
        return new ZeroOrMoreParser(this);
    }

    get oneOrMore(): Parser<OneOrMoreTuple<TResult>> {
        return new OneOrMoreParser(this);
    }

    get optional(): Parser<TResult | undefined> {
        return new OptionalParser(this);
    }

    get text(): Parser<string> {
        return new MatchedTextParser(this);
    }

    times<TCount extends number>(
        count: TCount,
    ): Parser<RepeatTuple<TResult, TCount>>;

    times(count: number): Parser<TResult[]> {
        try {
            return new TimesParser(this, count);
        } catch (error) {
            if (error instanceof TypeError) {
                throw new TypeError('repeat count must be a positive integer');
            } else if (error instanceof RangeError) {
                throw new RangeError('repeat count must be a positive integer');
            }
            throw error;
        }
    }

    // Note: This line is **required**. DO NOT DELETE IT.
    //       If you do not specify a return type definition for actionFn, tuples are converted to arrays.
    //       However, this overload solves this problem.
    action<TActionRes extends OneOrMoreReadonlyTuple<unknown>>(
        actionFn: ActionFunc<TResult, TActionRes>,
    ): Parser<TActionRes>;

    action<TActionRes extends unknown>(
        actionFn: ActionFunc<TResult, TActionRes>,
    ): Parser<TActionRes>;

    action<TActionRes>(
        actionFn: ActionFunc<TResult, TActionRes>,
    ): Parser<TActionRes> {
        return new ActionParser(this, actionFn);
    }

    value<TValue extends boolean>(value: TValue): Parser<TValue>;
    value<TValue extends number>(value: TValue): Parser<TValue>;
    value<TValue extends string>(value: TValue): Parser<TValue>;
    value<TValue extends OneOrMoreReadonlyTuple<unknown>>(
        value: TValue,
    ): Parser<TValue>;

    value<TValue extends unknown>(value: TValue): Parser<TValue>;
    value<TValue>(value: TValue): Parser<TValue> {
        return new ValueConverterParser(this, value);
    }

    match(
        predicate: Parser<unknown> | ActionFunc<TResult, boolean>,
    ): Parser<TResult> {
        if (arguments.length < 1) throw new Error('one argument required');
        return new MatchPredicateParser(this, predicate, {
            negative: false,
            errorMessage: {
                predicateType:
                    'only the Parser object or function can be specified as argument',
            },
        });
    }

    parse(input: string, offsetStart: number = 0): TResult {
        const result = this.tryParse(input, offsetStart, Infinity);
        if (!result) {
            throw new Error('Parse fail!');
        }
        if (result.offsetEnd < input.length) {
            throw new Error('Parse fail! end-of-input was not reached');
        }
        return result.data;
    }

    tryParse(
        input: string,
        offsetStart: number,
        stopOffset: number,
    ): ParseResult<TResult> {
        if (input.length < offsetStart) return undefined;

        return this.__memoStore.upsert(
            [input, offsetStart, stopOffset],
            undefined,
            () => this.__parse(input, offsetStart, stopOffset),
        );
    }
}
