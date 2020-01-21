import { ParserGenerator } from './parser-generator';

export {
    Parser,
    ParserResultDataType,
    ParseResult,
    CustomizableParser,
} from './parser';
export { AnyCharacterParser } from './parser/any-character';
export { CharacterClassParser } from './parser/character-class';
export { LiteralStringParser } from './parser/literal-string';
export { RepetitionParser } from './parser/repetition';
export { ParserGenerator } from './parser-generator';

export default new ParserGenerator();
