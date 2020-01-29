/**
 * @see https://www.unicode.org/Public/12.1.0/ucd/CaseFolding.txt
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const prettier = require('prettier');

const writeFileAsync = util.promisify(fs.writeFile);

async function formatCode(code, filename) {
  const prettierOptions = await prettier.resolveConfig(filename);
  return prettier.format(code, { filepath: filename, ...prettierOptions });
}

async function main(args) {
  const cwd = process.cwd();

  const [outFileName, unicodeVersion] = args;
  const outFilepath = path.resolve(cwd, outFileName);

  const codePointsC = require(`unicode-${unicodeVersion}/Case_Folding/C/code-points`);
  const codePointsS = require(`unicode-${unicodeVersion}/Case_Folding/S/code-points`);
  const codeMappingMap = new Map(
    [...codePointsC, ...codePointsS].sort(([a], [b]) => a - b),
  );
  const targetCharClass = [...codeMappingMap.keys()]
    .reduce((list, code) => {
      const codeRange = list.pop() || [code, code];
      if ([code, code - 1].includes(codeRange[1])) {
        codeRange[1] = code;
        return [...list, codeRange];
      }
      return [...list, codeRange, [code, code]];
    }, [])
    .map(([codeMin, codeMax]) =>
      codeMin === codeMax
        ? String.fromCodePoint(codeMin)
        : codeMin + 1 === codeMax
        ? String.fromCodePoint(codeMin) + String.fromCodePoint(codeMax)
        : String.fromCodePoint(codeMin) + '-' + String.fromCodePoint(codeMax),
    )
    .join('');

  const filedata = [
    `export const unicodeVersion = '${unicodeVersion}' as const;\n`,
    '',
    '// eslint-disable-next-line no-misleading-character-class\n',
    `export const replaceRegExp = /[${targetCharClass}]/gu;`,
    '',
    'export const mappingMap = new Map<string, string>([',
    [...codeMappingMap.entries()]
      .map(
        ([code, mapping]) =>
          `['${String.fromCodePoint(code)}','${String.fromCodePoint(
            mapping,
          )}']`,
      )
      .join(','),
    ']);',
    '',
    'export function canonicalize(str: string): string {',
    'return str.replace(replaceRegExp, char => mappingMap.get(char) ?? char);',
    '};',
    '',
    'export const mappingCharsMap = new Map<number, [number,number,...number[]]>();',
    'for (const [codeChar, mappingChar] of mappingMap) {',
    '  const code = codeChar.codePointAt(0);',
    '  const mapping = mappingChar.codePointAt(0);',
    '  if (typeof code !== "number" || typeof mapping !== "number") continue;',
    '  let chars = mappingCharsMap.get(mapping);',
    '  if (chars) {',
    '    chars.push(code);',
    '  } else {',
    '    chars = [code, mapping];',
    '    mappingCharsMap.set(mapping, chars);',
    '  }',
    '  mappingCharsMap.set(code, chars);',
    '}',
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
