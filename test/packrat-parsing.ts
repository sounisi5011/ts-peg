import test from 'ava';
import { performance, PerformanceEntry, PerformanceObserver } from 'perf_hooks';
import * as sta from 'simple-statistics';

import p, { Parser } from '../src';

function isLinearity(
    data: number[],
    standardDeviationThreshold: number,
): boolean {
    const diffs = data.reduce<number[]>(
        (diffs, value, index, data) =>
            index > 0 ? [...diffs, value - data[index - 1]] : [],
        [],
    );
    return sta.standardDeviation(diffs) <= standardDeviationThreshold;
}

test('should use Packrat Parsing', t => {
    /** @see https://engineering.linecorp.com/ja/blog/peg-parser-generator-packrat-parser/ */
    type A = [P, '+', A] | [P, '-', A] | P;
    type P = ['(', A, ')'] | '1';
    const S = p.seq(() => [A]); // eslint-disable-line @typescript-eslint/no-use-before-define
    const A: Parser<A> = p.or(() => [p.seq(P, '+', A), p.seq(P, '-', A), P]); // eslint-disable-line @typescript-eslint/no-use-before-define
    const P = p.or(p.seq('(', A, ')'), '1');

    const parse = performance.timerify(S.parse.bind(S));

    const entries: PerformanceEntry[] = [];
    const obs = new PerformanceObserver(list => {
        entries.push(...list.getEntries());
    });
    obs.observe({ entryTypes: ['function'] });

    for (const i of Array(15).keys()) {
        parse('('.repeat(i) + '1' + ')'.repeat(i));
    }

    const durations = entries.map(ent => ent.duration);

    t.log(entries);
    t.log({ durations });
    t.true(isLinearity(durations, 100));
});
