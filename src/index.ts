import { ParserGenerator } from './internal';

export {
    Parser,
    ParserResultDataType,
    ParseResult,
    ParseSuccessResult,
    CustomizableParser,
    CustomizableParserParseFunc,
    AnyCharacterParser,
    CharacterClassParser,
    LiteralStringParser,
    TimesParser,
    ParserGenerator,
    OneOrMoreParser,
    ZeroOrMoreParser,
    OptionalParser,
    ActionParser,
    ActionExecutionEnvironment,
    ActionFunc,
    ValueConverterParser,
    MatchedTextParser,
} from './internal';

export default new ParserGenerator();
