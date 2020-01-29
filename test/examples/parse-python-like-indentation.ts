import test from 'ava';

import offSideRule from '../../examples/python-like-indentation.grammar';

test('should parse', t => {
    const text = [
        'foo',
        'bar',
        '  hoge',
        '  fuga',
        'baz',
        'test',
        '   lv1',
        '     lv2.1',
        '       lv3',
        '     lv2.2',
    ].join('\n');
    t.deepEqual(offSideRule.parse(text), [
        'foo',
        'bar',
        ['hoge', 'fuga'],
        'baz',
        'test',
        ['lv1', ['lv2.1', ['lv3'], 'lv2.2']],
    ]);
});
