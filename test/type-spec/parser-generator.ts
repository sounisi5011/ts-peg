import { assertType, TypeEq } from 'typepark';

import p, { ParserResultDataType } from '../../src';

// p.any
{
    const parser = p.any;
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}

// p.str()
{
    const parser = p.str('1');
    assertType<TypeEq<'1', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.str((42).toString());
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}

// p.chars()
{
    const parser = p.chars('a-z');
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}

// p.seq()
{
    const parser = p.seq('1');
    assertType<TypeEq<['1'], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq(() => ['1']);
    assertType<TypeEq<[string], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq(() => ['1'] as const);
    assertType<TypeEq<['1'], ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.seq('x', 'y', p.any);
    assertType<
        TypeEq<['x', 'y', string], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.seq(() => ['x', 'y', p.any]);
    assertType<
        TypeEq<[string, string, string], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.seq(() => ['x', 'y', p.any] as const);
    assertType<
        TypeEq<['x', 'y', string], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.seq(p.chars('A-Z'), '-', p.chars('0-9'));
    assertType<
        TypeEq<[string, '-', string], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.seq(() => [p.chars('A-Z'), '-', p.chars('0-9')]);
    assertType<
        TypeEq<[string, string, string], ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.seq(() => [p.chars('A-Z'), '-', p.chars('0-9')] as const);
    assertType<
        TypeEq<[string, '-', string], ParserResultDataType<typeof parser>>
    >();
}

// p.or()
{
    const parser = p.or('1');
    assertType<TypeEq<'1', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or(() => ['1']);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or(() => ['1'] as const);
    assertType<TypeEq<'1', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or('x', 'y', 'z');
    assertType<TypeEq<'x' | 'y' | 'z', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or(() => ['x', 'y', 'z']);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or(() => ['x', 'y', 'z'] as const);
    assertType<TypeEq<'x' | 'y' | 'z', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or('x', 'y', p.any);
    assertType<
        TypeEq<'x' | 'y' | string, ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.or(() => ['x', 'y', p.any]);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or(() => ['x', 'y', p.any] as const);
    assertType<
        TypeEq<'x' | 'y' | string, ParserResultDataType<typeof parser>>
    >();
}
{
    const parser = p.or('α', 'β', p.str('γ'));
    assertType<TypeEq<'α' | 'β' | 'γ', ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or(() => ['α', 'β', p.str('γ')]);
    assertType<TypeEq<string, ParserResultDataType<typeof parser>>>();
}
{
    const parser = p.or(() => ['α', 'β', p.str('γ')] as const);
    assertType<TypeEq<'α' | 'β' | 'γ', ParserResultDataType<typeof parser>>>();
}
