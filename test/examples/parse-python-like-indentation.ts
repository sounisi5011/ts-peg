import test from 'ava';

import offSideRule from '../../examples/python-like-indentation.grammar';

test('should parse', t => {
    const text = [
        'foo',
        '  bar',
        '    hoge',
        '    fuga',
        '    zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        '  hoge',
        '      fuga',
        '       piyo',
        '      Fuga',
        '      toto',
        '         blablablablabla',
        '  xyzzy',
    ].join('\n');
    t.deepEqual(offSideRule.parse(text), {
        foo: [
            {
                bar: [
                    'hoge',
                    'fuga',
                    'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
                ],
            },
            {
                hoge: [
                    { fuga: ['piyo'] },
                    'Fuga',
                    { toto: ['blablablablabla'] },
                ],
            },
            'xyzzy',
        ],
    });
});
