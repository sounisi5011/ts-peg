import test from 'ava';

import p from '../src';

test('should parse arithmetics', t => {
    t.timeout(1000);

    /** @see https://engineering.linecorp.com/ja/blog/peg-parser-generator-packrat-parser/ */
    const S = p.seq(() => [A]); // eslint-disable-line @typescript-eslint/no-use-before-define
    const A = p.or(() => [p.seq(P, '+', A), p.seq(P, '-', A), P]); // eslint-disable-line @typescript-eslint/no-use-before-define
    const P = p.or(p.seq('(', A, ')'), '1');

    t.log(S.parse('(((((((((((((1)))))))))))))'));
});
