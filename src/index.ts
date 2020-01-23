import { ParserGenerator } from './internal';

export {
    Parser,
    ParserResultDataType,
    ParseResult,
    CustomizableParser,
    AnyCharacterParser,
    CharacterClassParser,
    LiteralStringParser,
    TimesParser,
    ParserGenerator,
    OneOrMoreParser,
    ZeroOrMoreParser,
    ActionParser,
    ActionExecutionEnvironment,
    ActionFunc,
    ValueConverterParser,
    MatchedTextParser,
} from './internal';

export default new ParserGenerator();
