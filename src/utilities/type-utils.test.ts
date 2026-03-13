import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { describe, expect, it } from 'bun:test';

import { collectParamTypeAnnotations, getTypeName } from './type-utils.ts';

describe('getTypeName', () => {
  it('returns the name for an Identifier node', () => {
    const node = {
      type: AST_NODE_TYPES.Identifier,
      name: 'MyType',
    } as any;

    expect(getTypeName(node)).toBe('MyType');
  });

  it('returns the right name for a TSQualifiedName node', () => {
    const node = {
      type: AST_NODE_TYPES.TSQualifiedName,
      left: {
        type: AST_NODE_TYPES.Identifier,
        name: 'Temporal',
      },
      right: {
        type: AST_NODE_TYPES.Identifier,
        name: 'WorkflowInfo',
      },
    } as any;

    expect(getTypeName(node)).toBe('WorkflowInfo');
  });

  it('returns null for an unrecognized node type', () => {
    const node = {
      type: AST_NODE_TYPES.TSTypeReference,
    } as any;

    expect(getTypeName(node)).toBeNull();
  });
});

describe('collectParamTypeAnnotations', () => {
  it('collects type annotation from a simple parameter', () => {
    const typeAnnotation = {
      type: AST_NODE_TYPES.TSTypeAnnotation,
      typeAnnotation: {
        type: AST_NODE_TYPES.TSStringKeyword,
      },
    };

    const param = {
      type: AST_NODE_TYPES.Identifier,
      name: 'input',
      typeAnnotation,
    } as any;

    const result = collectParamTypeAnnotations(param);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(typeAnnotation as any);
  });

  it('collects type annotation from a RestElement parameter argument', () => {
    const argumentTypeAnnotation = {
      type: AST_NODE_TYPES.TSTypeAnnotation,
      typeAnnotation: {
        type: AST_NODE_TYPES.TSArrayType,
      },
    };

    const param = {
      type: AST_NODE_TYPES.RestElement,
      argument: {
        type: AST_NODE_TYPES.Identifier,
        name: 'rest',
        typeAnnotation: argumentTypeAnnotation,
      },
    } as any;

    const result = collectParamTypeAnnotations(param);

    // RestElement itself has no typeAnnotation, but its argument does
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(argumentTypeAnnotation as any);
  });

  it('collects type annotation from an AssignmentPattern parameter', () => {
    const leftTypeAnnotation = {
      type: AST_NODE_TYPES.TSTypeAnnotation,
      typeAnnotation: {
        type: AST_NODE_TYPES.TSNumberKeyword,
      },
    };

    const param = {
      type: AST_NODE_TYPES.AssignmentPattern,
      left: {
        type: AST_NODE_TYPES.Identifier,
        name: 'count',
        typeAnnotation: leftTypeAnnotation,
      },
      right: {
        type: AST_NODE_TYPES.Literal,
        value: 0,
      },
    } as any;

    const result = collectParamTypeAnnotations(param);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(leftTypeAnnotation as any);
  });

  it('returns an empty array for a parameter with no type annotation', () => {
    const param = {
      type: AST_NODE_TYPES.Identifier,
      name: 'untyped',
    } as any;

    const result = collectParamTypeAnnotations(param);

    expect(result).toHaveLength(0);
  });

  it('collects annotations from a RestElement that itself has a typeAnnotation and an argument with one', () => {
    const restTypeAnnotation = {
      type: AST_NODE_TYPES.TSTypeAnnotation,
      typeAnnotation: {
        type: AST_NODE_TYPES.TSArrayType,
      },
    };

    const argumentTypeAnnotation = {
      type: AST_NODE_TYPES.TSTypeAnnotation,
      typeAnnotation: {
        type: AST_NODE_TYPES.TSStringKeyword,
      },
    };

    const param = {
      type: AST_NODE_TYPES.RestElement,
      typeAnnotation: restTypeAnnotation,
      argument: {
        type: AST_NODE_TYPES.Identifier,
        name: 'items',
        typeAnnotation: argumentTypeAnnotation,
      },
    } as any;

    const result = collectParamTypeAnnotations(param);

    // Both the RestElement's own typeAnnotation and the argument's typeAnnotation
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(restTypeAnnotation as any);
    expect(result[1]).toBe(argumentTypeAnnotation as any);
  });
});
