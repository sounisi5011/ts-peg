import { assertType, TypeEq } from 'typepark';

import { hasProperty } from '../../../src/utils';

interface Test {
    prop1?: number;
    prop2?: number | undefined;
}

const value: Test = {};

assertType<TypeEq<typeof value.prop1, number | undefined>>();
assertType<TypeEq<typeof value.prop2, number | undefined>>();
assertType<TypeEq<keyof typeof value, 'prop1' | 'prop2'>>();
assertType<TypeEq<typeof value, Test>>();
assertType<
    TypeEq<typeof value, { prop1?: number; prop2?: number | undefined }>
>();

if (hasProperty(value, 'prop1')) {
    assertType<TypeEq<typeof value.prop1, number>>();
    assertType<TypeEq<typeof value.prop2, number | undefined>>();
    assertType<TypeEq<keyof typeof value, 'prop1' | 'prop2'>>();
    assertType<TypeEq<typeof value, Test & { prop1: number }>>();
}

if (hasProperty(value, 'prop2')) {
    assertType<TypeEq<typeof value.prop1, number | undefined>>();
    // assertType<TypeEq<typeof value.prop2, number | undefined>>();
    assertType<TypeEq<typeof value.prop2, number>>();
    assertType<TypeEq<keyof typeof value, 'prop1' | 'prop2'>>();
    assertType<TypeEq<typeof value, Test & { prop2: number }>>();
}

if (hasProperty(value, 'propN')) {
    assertType<TypeEq<typeof value.prop1, number | undefined>>();
    assertType<TypeEq<typeof value.prop2, number | undefined>>();
    assertType<TypeEq<typeof value.propN, unknown>>();
    assertType<TypeEq<keyof typeof value, 'prop1' | 'prop2' | 'propN'>>();
    assertType<TypeEq<typeof value, Test & { propN: unknown }>>();
}
