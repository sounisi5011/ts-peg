import test from 'ava';

import offSideRule from '../../examples/python-like-indentation.grammar';

test('should parse', t => {
    const text = [
        'foo',
        '  bar',
        '    hoge',
        '    fuga',
        '     piyo',
        '    Fuga',
        '  xyzzy',
        'lv1',
        ' lv2',
        '              lv3',
        '',
        '',
        'THE END',
    ].join('\n');
    t.deepEqual(offSideRule.parse(text), [
        {
            name: 'foo',
            children: [
                {
                    name: 'bar',
                    children: [
                        { name: 'hoge', children: [] },
                        {
                            name: 'fuga',
                            children: [{ name: 'piyo', children: [] }],
                        },
                        { name: 'Fuga', children: [] },
                    ],
                },
                { name: 'xyzzy', children: [] },
            ],
        },
        {
            name: 'lv1',
            children: [
                { name: 'lv2', children: [{ name: 'lv3', children: [] }] },
            ],
        },
        { name: 'THE END', children: [] },
    ]);
});
