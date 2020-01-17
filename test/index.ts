import test from 'ava';

import Expression from '../examples/arithmetics.grammar';

test('should parse arithmetics', t => {
    t.is(Expression.parse('1'), 1);
    t.is(Expression.parse('2 * (3 + 4)'), 2 * (3 + 4));
});
