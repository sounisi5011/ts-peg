import ParserGenerator from './parser-generator';

export { default as Parser, ParserResult } from './parser';
export { default as CharacterClassParser } from './parser/character-class';
export { default as ParserGenerator } from './parser-generator';

export default new ParserGenerator();
