import test from 'ava';

import p, { ParseSuccessResult } from '../../../src';
import {
    AnyOrMoreParser,
    ParserLike,
    ReduceParser,
    ValueConverter,
} from '../../../src/internal';

test('AnyOrMoreParser', t => {
    class CustomParserX extends AnyOrMoreParser<
        unknown,
        ParseSuccessResult<unknown>[]
    > {
        protected __resultsValidator(
            results: unknown[],
        ): results is ParseSuccessResult<unknown>[] {
            return results.length >= 0;
        }
    }
    class CustomParserY extends CustomParserX {}

    const prevParser = p.any;

    t.true(new CustomParserX(prevParser) instanceof CustomParserX);
    t.false(new CustomParserX(prevParser) instanceof CustomParserY);
    t.true(new CustomParserY(prevParser) instanceof CustomParserY);

    t.not(new CustomParserX(prevParser), new CustomParserY(prevParser));
    t.is(new CustomParserX(prevParser), new CustomParserX(prevParser));
    t.is(new CustomParserY(prevParser), new CustomParserY(prevParser));
    t.not(new CustomParserX(prevParser), new CustomParserY(prevParser));

    t.true(new CustomParserX(prevParser) instanceof CustomParserX);
    t.false(new CustomParserX(prevParser) instanceof CustomParserY);
    t.true(new CustomParserY(prevParser) instanceof CustomParserY);
});

test('ReduceParser', t => {
    class CustomParserX extends ReduceParser<0, [ParserLike, ...ParserLike[]]> {
        protected __parse(): undefined {
            return undefined;
        }
    }
    class CustomParserY extends CustomParserX {}

    t.true(new CustomParserX(p, ['x']) instanceof CustomParserX);
    t.false(new CustomParserX(p, ['x']) instanceof CustomParserY);
    t.true(new CustomParserY(p, ['x']) instanceof CustomParserY);

    t.not(new CustomParserX(p, ['x']), new CustomParserY(p, ['x']));
    t.is(new CustomParserX(p, ['x']), new CustomParserX(p, ['x']));
    t.is(new CustomParserY(p, ['x']), new CustomParserY(p, ['x']));
    t.not(new CustomParserX(p, ['x']), new CustomParserY(p, ['x']));

    t.true(new CustomParserX(p, ['x']) instanceof CustomParserX);
    t.false(new CustomParserX(p, ['x']) instanceof CustomParserY);
    t.true(new CustomParserY(p, ['x']) instanceof CustomParserY);
});

test('ValueConverter', t => {
    class CustomParserX extends ValueConverter<string, 0, null> {
        protected __valueConverter(): null {
            return null;
        }
    }
    class CustomParserY extends CustomParserX {}

    const prevParser = p.any;

    t.true(new CustomParserX(prevParser, 0) instanceof CustomParserX);
    t.false(new CustomParserX(prevParser, 0) instanceof CustomParserY);
    t.true(new CustomParserY(prevParser, 0) instanceof CustomParserY);

    t.not(new CustomParserX(prevParser, 0), new CustomParserY(prevParser, 0));
    t.is(new CustomParserX(prevParser, 0), new CustomParserX(prevParser, 0));
    t.is(new CustomParserY(prevParser, 0), new CustomParserY(prevParser, 0));
    t.not(new CustomParserX(prevParser, 0), new CustomParserY(prevParser, 0));

    t.true(new CustomParserX(prevParser, 0) instanceof CustomParserX);
    t.false(new CustomParserX(prevParser, 0) instanceof CustomParserY);
    t.true(new CustomParserY(prevParser, 0) instanceof CustomParserY);
});
