import { assertType, TypeEq } from 'typepark';

import p, { CharacterClassParser, Parser } from '../../src';

{
    const parser = p.any;
    assertType<TypeEq<typeof parser, Parser<string>>>();
}

{
    const parser = p.str('1');
    assertType<TypeEq<typeof parser, Parser<'1'>>>();
}
{
    const parser = p.str((42).toString());
    assertType<TypeEq<typeof parser, Parser<string>>>();
}

{
    const parser = p.chars('a-z');
    assertType<TypeEq<typeof parser, CharacterClassParser>>();
}

{
    const parser = p.zeroOrMore('1');
    assertType<TypeEq<typeof parser, Parser<['1'][]>>>();
}
{
    const parser = p.zeroOrMore(() => ['1'] as const);
    assertType<TypeEq<typeof parser, Parser<['1'][]>>>();
}
{
    const parser = p.zeroOrMore('x', 'y', p.any);
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string][]>>>();
}
{
    const parser = p.zeroOrMore(() => ['x', 'y', p.any] as const);
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string][]>>>();
}
{
    const parser = p.zeroOrMore(p.chars('A-Z'), '-', p.chars('0-9'));
    assertType<TypeEq<typeof parser, Parser<[string, '-', string][]>>>();
}
{
    const parser = p.zeroOrMore(
        () => [p.chars('A-Z'), '-', p.chars('0-9')] as const,
    );
    assertType<TypeEq<typeof parser, Parser<[string, '-', string][]>>>();
}

{
    const parser = p.oneOrMore('1');
    assertType<TypeEq<typeof parser, Parser<[['1'], ...['1'][]]>>>();
}
{
    const parser = p.oneOrMore(() => ['1']);
    assertType<TypeEq<typeof parser, Parser<[[string], ...[string][]]>>>();
}
{
    const parser = p.oneOrMore(() => ['1'] as const);
    assertType<TypeEq<typeof parser, Parser<[['1'], ...['1'][]]>>>();
}
{
    const parser = p.oneOrMore('x', 'y', p.any);
    assertType<
        TypeEq<
            typeof parser,
            Parser<[['x', 'y', string], ...['x', 'y', string][]]>
        >
    >();
}
{
    const parser = p.oneOrMore(() => ['x', 'y', p.any]);
    assertType<
        TypeEq<
            typeof parser,
            Parser<[[string, string, string], ...[string, string, string][]]>
        >
    >();
}
{
    const parser = p.oneOrMore(() => ['x', 'y', p.any] as const);
    assertType<
        TypeEq<
            typeof parser,
            Parser<[['x', 'y', string], ...['x', 'y', string][]]>
        >
    >();
}
{
    const parser = p.oneOrMore(p.chars('A-Z'), '-', p.chars('0-9'));
    assertType<
        TypeEq<
            typeof parser,
            Parser<[[string, '-', string], ...[string, '-', string][]]>
        >
    >();
}
{
    const parser = p.oneOrMore(() => [p.chars('A-Z'), '-', p.chars('0-9')]);
    assertType<
        TypeEq<
            typeof parser,
            Parser<[[string, string, string], ...[string, string, string][]]>
        >
    >();
}
{
    const parser = p.oneOrMore(
        () => [p.chars('A-Z'), '-', p.chars('0-9')] as const,
    );
    assertType<
        TypeEq<
            typeof parser,
            Parser<[[string, '-', string], ...[string, '-', string][]]>
        >
    >();
}

{
    const parser = p.optional('1');
    assertType<TypeEq<typeof parser, Parser<['1'] | undefined>>>();
}
{
    const parser = p.optional(() => ['1']);
    assertType<TypeEq<typeof parser, Parser<[string] | undefined>>>();
}
{
    const parser = p.optional(() => ['1'] as const);
    assertType<TypeEq<typeof parser, Parser<['1'] | undefined>>>();
}
{
    const parser = p.optional('x', 'y', p.any);
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string] | undefined>>>();
}
{
    const parser = p.optional(() => ['x', 'y', p.any]);
    assertType<
        TypeEq<typeof parser, Parser<[string, string, string] | undefined>>
    >();
}
{
    const parser = p.optional(() => ['x', 'y', p.any] as const);
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string] | undefined>>>();
}
{
    const parser = p.optional(p.chars('A-Z'), '-', p.chars('0-9'));
    assertType<
        TypeEq<typeof parser, Parser<[string, '-', string] | undefined>>
    >();
}
{
    const parser = p.optional(() => [p.chars('A-Z'), '-', p.chars('0-9')]);
    assertType<
        TypeEq<typeof parser, Parser<[string, string, string] | undefined>>
    >();
}
{
    const parser = p.optional(
        () => [p.chars('A-Z'), '-', p.chars('0-9')] as const,
    );
    assertType<
        TypeEq<typeof parser, Parser<[string, '-', string] | undefined>>
    >();
}

{
    const parser = p.followedBy('1');
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy(() => ['1']);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy(() => ['1'] as const);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy('x', 'y', p.any);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy(() => ['x', 'y', p.any]);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy(() => ['x', 'y', p.any] as const);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy(p.chars('A-Z'), '-', p.chars('0-9'));
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy(() => [p.chars('A-Z'), '-', p.chars('0-9')]);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.followedBy(
        () => [p.chars('A-Z'), '-', p.chars('0-9')] as const,
    );
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}

{
    const parser = p.notFollowedBy('1');
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy(() => ['1']);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy(() => ['1'] as const);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy('x', 'y', p.any);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy(() => ['x', 'y', p.any]);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy(() => ['x', 'y', p.any] as const);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy(p.chars('A-Z'), '-', p.chars('0-9'));
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy(() => [p.chars('A-Z'), '-', p.chars('0-9')]);
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}
{
    const parser = p.notFollowedBy(
        () => [p.chars('A-Z'), '-', p.chars('0-9')] as const,
    );
    assertType<TypeEq<typeof parser, Parser<undefined>>>();
}

{
    const parser = p.seq('1');
    assertType<TypeEq<typeof parser, Parser<['1']>>>();
}
{
    const parser = p.seq(() => ['1']);
    assertType<TypeEq<typeof parser, Parser<[string]>>>();
}
{
    const parser = p.seq(() => ['1'] as const);
    assertType<TypeEq<typeof parser, Parser<['1']>>>();
}
{
    const parser = p.seq('x', 'y', p.any);
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string]>>>();
}
{
    const parser = p.seq(() => ['x', 'y', p.any]);
    assertType<TypeEq<typeof parser, Parser<[string, string, string]>>>();
}
{
    const parser = p.seq(() => ['x', 'y', p.any] as const);
    assertType<TypeEq<typeof parser, Parser<['x', 'y', string]>>>();
}
{
    const parser = p.seq(p.chars('A-Z'), '-', p.chars('0-9'));
    assertType<TypeEq<typeof parser, Parser<[string, '-', string]>>>();
}
{
    const parser = p.seq(() => [p.chars('A-Z'), '-', p.chars('0-9')]);
    assertType<TypeEq<typeof parser, Parser<[string, string, string]>>>();
}
{
    const parser = p.seq(() => [p.chars('A-Z'), '-', p.chars('0-9')] as const);
    assertType<TypeEq<typeof parser, Parser<[string, '-', string]>>>();
}

{
    const parser = p.or('1');
    assertType<TypeEq<typeof parser, Parser<'1'>>>();
}
{
    const parser = p.or(() => ['1']);
    assertType<TypeEq<typeof parser, Parser<string>>>();
}
{
    const parser = p.or(() => ['1'] as const);
    assertType<TypeEq<typeof parser, Parser<'1'>>>();
}
{
    const parser = p.or('x', 'y', 'z');
    assertType<TypeEq<typeof parser, Parser<'x' | 'y' | 'z'>>>();
}
{
    const parser = p.or(() => ['x', 'y', 'z']);
    assertType<TypeEq<typeof parser, Parser<string>>>();
}
{
    const parser = p.or(() => ['x', 'y', 'z'] as const);
    assertType<TypeEq<typeof parser, Parser<'x' | 'y' | 'z'>>>();
}
{
    const parser = p.or('x', 'y', p.any);
    assertType<TypeEq<typeof parser, Parser<'x' | 'y' | string>>>();
}
{
    const parser = p.or(() => ['x', 'y', p.any]);
    assertType<TypeEq<typeof parser, Parser<string>>>();
}
{
    const parser = p.or(() => ['x', 'y', p.any] as const);
    assertType<TypeEq<typeof parser, Parser<'x' | 'y' | string>>>();
}
{
    const parser = p.or('α', 'β', p.str('γ'));
    assertType<TypeEq<typeof parser, Parser<'α' | 'β' | 'γ'>>>();
}
{
    const parser = p.or(() => ['α', 'β', p.str('γ')]);
    assertType<TypeEq<typeof parser, Parser<string>>>();
}
{
    const parser = p.or(() => ['α', 'β', p.str('γ')] as const);
    assertType<TypeEq<typeof parser, Parser<'α' | 'β' | 'γ'>>>();
}
