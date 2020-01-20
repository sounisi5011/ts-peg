import test from 'ava';

import Expression from '../examples/arithmetics.grammar';

test('should parse arithmetics', t => {
    t.is(Expression.parse('1'), 1);
    t.is(Expression.parse('2 * (3 + 4)'), 2 * (3 + 4));
});

test('parsing should fail', t => {
    t.throws(
        () => Expression.parse('壱'),
        {
            instanceOf: Error,
            // TODO: Enable testing of error messages
            // message: /(?:^|\W)unexpected character "壱"(?:\W|$)/i,
        },
        'should fail because parser detect unexpected character',
    );
    t.throws(
        () => Expression.parse('1 + 弐'),
        {
            instanceOf: Error,
            // TODO: Enable testing of error messages
            // message: /(?:^|\W)unexpected character "弐"(?:\W|$)/i,
        },
        'should fail because parser detect unexpected character',
    );
    t.throws(
        () => Expression.parse('1 + 2 *'),
        {
            instanceOf: Error,
            // TODO: Enable testing of error messages
            // message: /(?:^|\W)unexpected end-of-input(?:\W|$)/i,
        },
        'should fail because parser detect unexpected end-of-input',
    );
    t.throws(
        () => Expression.parse('1 1'),
        {
            instanceOf: Error,
        },
        'should fail because end-of-input was not reached',
    );
});
