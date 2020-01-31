import test from 'ava';
import { assertType, TypeEq } from 'typepark';

import p, { Parser, ParserGenerator, ParserResultDataType } from '../../../src';

test('should match', t => {
    t.deepEqual(p.any.times(0).tryParse('abc', 0, Infinity)?.data, []);
    t.deepEqual(p.any.times(0).tryParse('', 0, Infinity)?.data, []);

    t.deepEqual(p.any.times(1).tryParse('abc', 0, Infinity)?.data, ['a']);
    t.deepEqual(
        p
            .str('x')
            .times(1)
            .tryParse('xxyyzz', 0, Infinity)?.data,
        ['x'],
    );
    t.deepEqual(p.any.times(1).tryParse('abc', 1, Infinity)?.data, ['b']);
    t.deepEqual(
        p
            .str('x')
            .times(1)
            .tryParse('xxyyzz', 1, Infinity)?.data,
        ['x'],
    );

    t.deepEqual(p.any.times(2).tryParse('abc', 0, Infinity)?.data, ['a', 'b']);
    t.deepEqual(
        p
            .str('x')
            .times(2)
            .tryParse('xxyyzz', 0, Infinity)?.data,
        ['x', 'x'],
    );

    t.deepEqual(p.any.times(3).tryParse('abc', 0, Infinity)?.data, [
        'a',
        'b',
        'c',
    ]);
});

test('should not match', t => {
    t.is(p.any.times(1).tryParse('', 0, Infinity), undefined);
    t.is(p.any.times(4).tryParse('abc', 0, Infinity), undefined);
    t.is(
        p
            .str('x')
            .times(1)
            .tryParse('abc', 0, Infinity),
        undefined,
    );
    t.is(
        p
            .str('x')
            .times(2)
            .tryParse('xxyyzz', 1, Infinity),
        undefined,
    );
    t.is(p.any.times(1).tryParse('abc', 99, Infinity), undefined);
    t.is(
        p.any.times(Number.MAX_SAFE_INTEGER).tryParse('abc', 0, Infinity),
        undefined,
    );
    t.is(p.any.times(3).tryParse('abc', 0, 2), undefined);
});

test('should fail call method', t => {
    t.throws(() => p.any.times(-1 as number), {
        instanceOf: RangeError,
        message: 'repeat count must be a positive integer',
    });
    t.throws(() => p.any.times(1.1 as number), {
        instanceOf: RangeError,
        message: 'repeat count must be a positive integer',
    });
    t.throws(() => p.any.times(NaN), {
        instanceOf: RangeError,
        message: 'repeat count must be a positive integer',
    });
    t.throws(() => p.any.times(Infinity), {
        instanceOf: RangeError,
        message: 'repeat count must be a positive integer',
    });

    /* eslint-disable @typescript-eslint/no-explicit-any */
    t.throws(() => p.any.times(null as any), {
        instanceOf: TypeError,
        message: 'repeat count must be a positive integer',
    });
    t.throws(() => p.any.times(undefined as any), {
        instanceOf: TypeError,
        message: 'repeat count must be a positive integer',
    });
    t.throws(() => p.any.times(true as any), {
        instanceOf: TypeError,
        message: 'repeat count must be a positive integer',
    });
    t.throws(() => p.any.times('42' as any), {
        instanceOf: TypeError,
        message: 'repeat count must be a positive integer',
    });
    t.throws(() => p.any.times({} as any), {
        instanceOf: TypeError,
        message: 'repeat count must be a positive integer',
    });
    // eslint-disable-next-line no-new-wrappers
    t.throws(() => p.any.times(new Number(42) as any), {
        instanceOf: TypeError,
        message: 'repeat count must be a positive integer',
    });
    /* eslint-enable */
});

test('if the arguments have the same value, they should return the same Parser object', t => {
    const parser1α = p.str('α');
    const parser1β = p.str('β');
    const parser2α = new ParserGenerator().str('α');
    const times1α1A = parser1α.times(1);
    const times1α1B = parser1α.times(1);
    const times1α2A = parser1α.times(2);
    const times1α2B = parser1α.times(2);
    const times1β1A = parser1β.times(1);
    const times1β1B = parser1β.times(1);
    const times2α1A = parser2α.times(1);
    const times2α1B = parser2α.times(1);

    t.is(times1α1A, times1α1B);
    t.is(times1α2A, times1α2B);
    t.is(times1β1A, times1β1B);
    t.is(times2α1A, times2α1B);

    t.not<Parser<string[]>>(times1α1A, times1α2A);
    t.not<Parser<[string]>>(times1α1A, times1β1A);
    t.not(
        times1α1A,
        times2α1A,
        'If the ParserGenerator instance is different, the Parser object will also be different',
    );
    t.not<Parser<[string]>>(times1β1A, times2α1A);

    assertType<TypeEq<['α'], ParserResultDataType<typeof times1α1A>>>();
    assertType<TypeEq<['α'], ParserResultDataType<typeof times1α1B>>>();
    assertType<TypeEq<['α', 'α'], ParserResultDataType<typeof times1α2A>>>();
    assertType<TypeEq<['α', 'α'], ParserResultDataType<typeof times1α2B>>>();
    assertType<TypeEq<['β'], ParserResultDataType<typeof times1β1A>>>();
    assertType<TypeEq<['β'], ParserResultDataType<typeof times1β1B>>>();
    assertType<TypeEq<['α'], ParserResultDataType<typeof times2α1A>>>();
    assertType<TypeEq<['α'], ParserResultDataType<typeof times2α1B>>>();
});
