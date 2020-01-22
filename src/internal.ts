/**
 * This file is a hack to avoid the effects of recursive imports.
 * @see https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de
 */

export * from './parser';
export * from './parser/any-character';
export * from './parser/character-class';
export * from './parser/literal-string';
export * from './parser/one-or-more';
export * from './parser/repetition';
export * from './parser/zero-or-more';
export * from './parser-generator';
