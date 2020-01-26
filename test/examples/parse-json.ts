import test from 'ava';

import JSONText from '../../examples/json.grammar';

for (const jsonStr of [
    'null',
    'true',
    'false',
    '42',
    '"foo"',
    '[]',
    '[-1, -0, 0, 1, 42, 3.14, 6e8, 7e-1, 1e+01]',
    '{}',
    '{"key": "value"}',
    String.raw`{"escape": "\" \/ \\ \b \f \n \r \t \u80c3\u888B > \uD83d\udC32"}`,
    '{"name": "John Smith", "age": 33}',
    '[ {"x":[1, 2,  {"X":  []}]}, {"y": 42} ]',
]) {
    test(jsonStr, t => {
        t.deepEqual(JSONText.parse(jsonStr), JSON.parse(jsonStr));
    });
}
