import ParserGenerator from './parser-generator';

export { default as Parser, ParserResult } from './parser';
export { AnyCharacterParser } from './parser/any-character';
export { default as CharacterClassParser } from './parser/character-class';
export { LiteralStringParser } from './parser/literal-string';
export { default as ParserGenerator } from './parser-generator';

export default new ParserGenerator();
