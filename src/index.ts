import { ParserGenerator } from './parser-generator';

export { Parser, ParserResult } from './parser';
export { AnyCharacterParser } from './parser/any-character';
export { CharacterClassParser } from './parser/character-class';
export { LiteralStringParser } from './parser/literal-string';
export { ParserGenerator } from './parser-generator';

export default new ParserGenerator();
