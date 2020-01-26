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
    SequenceParser,
    PrioritizedChoiceParser,
    PredicateParser,
    PredicateFunc,
    PredicateExecutionEnvironment,
} from './internal';

export default new ParserGenerator();
