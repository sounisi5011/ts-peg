/**
 * @see https://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const prettier = require('prettier');
const codePointsC = require('unicode-12.1.0/Case_Folding/C/code-points');
const codePointsS = require('unicode-12.1.0/Case_Folding/S/code-points');

const writeFileAsync = util.promisify(fs.writeFile);

function int2hex(num) {
  return (
    '0x' +
    num
      .toString(16)
      .toUpperCase()
      .padStart(4, '0')
  );
}

async function formatCode(code, filename) {
  const { languages } = prettier.getSupportInfo();
  const prettierOptions = await prettier.resolveConfig(filename);
  return prettier.format(code, { filepath: filename, ...prettierOptions });
}

async function main(args) {
  const cwd = process.cwd();

  const [outFileName] = args;
  const outFilepath = path.resolve(cwd, outFileName);

  const codeMappingMap = new Map();
  const codeMappingInverseMap = new Map();

  for (const codePoints of [codePointsC, codePointsS]) {
    for (const [code, mapping] of codePoints) {
      codeMappingMap.set(code, mapping);
      if (codeMappingInverseMap.has(mapping)) {
        codeMappingInverseMap.get(mapping).add(code);
      } else {
        codeMappingInverseMap.set(mapping, new Set([code]));
      }
    }
  }
  const codePointSet = new Set([
    ...codeMappingMap.keys(),
    ...codeMappingInverseMap.keys(),
  ]);

  const filedata = [
    'export = new Map<number, { mapping?:number; codes:number[] }>([',
    [...codePointSet]
      .sort((a, b) => a - b)
      .map(code => {
        const itemList = [];
        const mapping = codeMappingMap.get(code);
        const codes = new Set([code]);

        if (typeof mapping === 'number') {
          itemList.push(`mapping:${int2hex(mapping)}`);

          codes.add(mapping);
          for (const mappingCode of codeMappingInverseMap.get(mapping)) {
            codes.add(mappingCode);
          }
        } else {
          for (const mappingCode of codeMappingInverseMap.get(code) || []) {
            codes.add(mappingCode);
          }
        }
        itemList.push(
          `codes:[${[...codes]
            .sort((a, b) => a - b)
            .map(int2hex)
            .join()}]`,
        );

        const record = [int2hex(code), `{${itemList.reverse().join()}}`];

        return `[${record.join()}]`;
      })
      .join(),
    ']);',
  ];

  const code = await formatCode(filedata.join(''), outFilepath);
  await writeFileAsync(outFilepath, code);
}

(async () => {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    process.exitCode = 1;
    console.error(err);
  }
})();
