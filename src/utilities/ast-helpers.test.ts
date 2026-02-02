import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { describe, expect, it } from 'bun:test';

import {
  getEnclosingLoop,
  getMemberExpressionProperty,
  getProperty,
  getStringValue,
  hasProperty,
  isAwaitExpression,
  isCallExpression,
  isIdentifier,
  isInsideFunction,
  isInsideLoop,
  isMemberExpression,
  isMemberExpressionMatch,
  isNewError,
  isThrowStatement,
  loopContainsAwait,
} from './ast-helpers.ts';

// Helper to parse code and get the program
function parseCode(code: string): TSESTree.Program {
  return parse(code, {
    range: true,
    loc: true,
  }) as TSESTree.Program;
}

// Helper to find a node by type in the AST
function findNode<T extends TSESTree.Node>(
  program: TSESTree.Program,
  type: AST_NODE_TYPES,
): T | undefined {
  const stack: TSESTree.Node[] = [program];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.type === type) {
      return node as T;
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'range' || key === 'loc') continue;
      const value = (node as any)[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item) {
              stack.push(item);
            }
          }
        } else if ('type' in value) {
          stack.push(value);
        }
      }
    }
  }
  return undefined;
}

// Helper to find all nodes of a type
function findAllNodes<T extends TSESTree.Node>(
  program: TSESTree.Program,
  type: AST_NODE_TYPES,
): T[] {
  const results: T[] = [];
  const stack: TSESTree.Node[] = [program];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.type === type) {
      results.push(node as T);
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'range' || key === 'loc') continue;
      const value = (node as any)[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item) {
              stack.push(item);
            }
          }
        } else if ('type' in value) {
          stack.push(value);
        }
      }
    }
  }
  return results;
}

// Helper to set parent references (needed for traversal functions)
function setParentReferences(node: TSESTree.Node, parent?: TSESTree.Node): void {
  (node as any).parent = parent;
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') continue;
    const value = (node as any)[key];
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && 'type' in item) {
            setParentReferences(item, node);
          }
        }
      } else if ('type' in value) {
        setParentReferences(value, node);
      }
    }
  }
}

describe('isIdentifier', () => {
  it('returns true for identifier node', () => {
    const program = parseCode('const x = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isIdentifier(identifier)).toBe(true);
  });

  it('returns true for identifier with matching name', () => {
    const program = parseCode('const foo = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isIdentifier(identifier, 'foo')).toBe(true);
  });

  it('returns false for identifier with non-matching name', () => {
    const program = parseCode('const foo = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isIdentifier(identifier, 'bar')).toBe(false);
  });

  it('returns false for non-identifier node', () => {
    const program = parseCode('const x = 42;');
    const literal = findNode<TSESTree.Literal>(program, AST_NODE_TYPES.Literal);
    expect(isIdentifier(literal)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isIdentifier(null)).toBe(false);
    expect(isIdentifier(undefined)).toBe(false);
  });
});

describe('isMemberExpression', () => {
  it('returns true for member expression', () => {
    const program = parseCode('console.log;');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    expect(isMemberExpression(memberExpr)).toBe(true);
  });

  it('returns false for non-member expression', () => {
    const program = parseCode('const x = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isMemberExpression(identifier)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isMemberExpression(null)).toBe(false);
    expect(isMemberExpression(undefined)).toBe(false);
  });
});

describe('isCallExpression', () => {
  it('returns true for call expression', () => {
    const program = parseCode('console.log("test");');
    const callExpr = findNode<TSESTree.CallExpression>(
      program,
      AST_NODE_TYPES.CallExpression,
    );
    expect(isCallExpression(callExpr)).toBe(true);
  });

  it('returns false for non-call expression', () => {
    const program = parseCode('const x = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isCallExpression(identifier)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isCallExpression(null)).toBe(false);
    expect(isCallExpression(undefined)).toBe(false);
  });
});

describe('isMemberExpressionMatch', () => {
  it('matches console.log', () => {
    const program = parseCode('console.log;');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    expect(isMemberExpressionMatch(memberExpr, 'console', 'log')).toBe(true);
  });

  it('matches only object name without property', () => {
    const program = parseCode('console.log;');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    expect(isMemberExpressionMatch(memberExpr, 'console')).toBe(true);
  });

  it('returns false for non-matching object', () => {
    const program = parseCode('console.log;');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    expect(isMemberExpressionMatch(memberExpr, 'window', 'log')).toBe(false);
  });

  it('returns false for non-matching property', () => {
    const program = parseCode('console.log;');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    expect(isMemberExpressionMatch(memberExpr, 'console', 'error')).toBe(false);
  });

  it('handles computed property with string literal', () => {
    const program = parseCode('console["log"];');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    expect(isMemberExpressionMatch(memberExpr, 'console', 'log')).toBe(true);
  });

  it('returns false for computed property with non-matching literal', () => {
    const program = parseCode('console["error"];');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    expect(isMemberExpressionMatch(memberExpr, 'console', 'log')).toBe(false);
  });

  it('returns false for non-member expression', () => {
    const program = parseCode('const x = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isMemberExpressionMatch(identifier, 'console', 'log')).toBe(false);
  });
});

describe('getMemberExpressionProperty', () => {
  it('extracts identifier property', () => {
    const program = parseCode('console.log;');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    )!;
    expect(getMemberExpressionProperty(memberExpr)).toBe('log');
  });

  it('extracts string literal property', () => {
    const program = parseCode('console["log"];');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    )!;
    expect(getMemberExpressionProperty(memberExpr)).toBe('log');
  });

  it('returns undefined for computed property with variable', () => {
    const program = parseCode('const prop = "log"; console[prop];');
    const memberExprs = findAllNodes<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    );
    // The second member expression is console[prop]
    const memberExpr = memberExprs.find(
      (m) => m.computed && m.property.type === AST_NODE_TYPES.Identifier,
    )!;
    expect(getMemberExpressionProperty(memberExpr)).toBeUndefined();
  });

  it('returns undefined for computed property with number literal', () => {
    const program = parseCode('arr[0];');
    const memberExpr = findNode<TSESTree.MemberExpression>(
      program,
      AST_NODE_TYPES.MemberExpression,
    )!;
    expect(getMemberExpressionProperty(memberExpr)).toBeUndefined();
  });
});

describe('isInsideFunction', () => {
  it('returns true for code inside function declaration', () => {
    const program = parseCode('function foo() { const x = 1; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideFunction(identifier)).toBe(true);
  });

  it('returns true for code inside arrow function', () => {
    const program = parseCode('const fn = () => { const x = 1; };');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideFunction(identifier)).toBe(true);
  });

  it('returns true for code inside function expression', () => {
    const program = parseCode('const fn = function() { const x = 1; };');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideFunction(identifier)).toBe(true);
  });

  it('returns false for top-level code', () => {
    const program = parseCode('const x = 1;');
    setParentReferences(program);
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier)!;
    expect(isInsideFunction(identifier)).toBe(false);
  });
});

describe('isInsideLoop', () => {
  it('detects for loop', () => {
    const program = parseCode('for (let i = 0; i < 10; i++) { const x = 1; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideLoop(identifier)).toBe(true);
  });

  it('detects while loop', () => {
    const program = parseCode('while (true) { const x = 1; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideLoop(identifier)).toBe(true);
  });

  it('detects do-while loop', () => {
    const program = parseCode('do { const x = 1; } while (true);');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideLoop(identifier)).toBe(true);
  });

  it('detects for-of loop', () => {
    const program = parseCode('for (const item of items) { const x = item; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideLoop(identifier)).toBe(true);
  });

  it('detects for-in loop', () => {
    const program = parseCode('for (const key in obj) { const x = key; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    expect(isInsideLoop(identifier)).toBe(true);
  });

  it('returns false outside loop', () => {
    const program = parseCode('const x = 1;');
    setParentReferences(program);
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier)!;
    expect(isInsideLoop(identifier)).toBe(false);
  });
});

describe('getEnclosingLoop', () => {
  it('returns nearest loop node', () => {
    const program = parseCode('for (let i = 0; i < 10; i++) { const x = 1; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    const loop = getEnclosingLoop(identifier);
    expect(loop).toBeDefined();
    expect(loop?.type).toBe(AST_NODE_TYPES.ForStatement);
  });

  it('returns undefined outside loop', () => {
    const program = parseCode('const x = 1;');
    setParentReferences(program);
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier)!;
    expect(getEnclosingLoop(identifier)).toBeUndefined();
  });

  it('returns while loop node', () => {
    const program = parseCode('while (true) { const x = 1; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    const loop = getEnclosingLoop(identifier);
    expect(loop?.type).toBe(AST_NODE_TYPES.WhileStatement);
  });

  it('returns do-while loop node', () => {
    const program = parseCode('do { const x = 1; } while (true);');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    const loop = getEnclosingLoop(identifier);
    expect(loop?.type).toBe(AST_NODE_TYPES.DoWhileStatement);
  });

  it('returns for-of loop node', () => {
    const program = parseCode('for (const item of items) { const x = item; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    const loop = getEnclosingLoop(identifier);
    expect(loop?.type).toBe(AST_NODE_TYPES.ForOfStatement);
  });

  it('returns for-in loop node', () => {
    const program = parseCode('for (const key in obj) { const x = key; }');
    setParentReferences(program);
    const identifier = findAllNodes<TSESTree.Identifier>(
      program,
      AST_NODE_TYPES.Identifier,
    ).find((id) => id.name === 'x')!;
    const loop = getEnclosingLoop(identifier);
    expect(loop?.type).toBe(AST_NODE_TYPES.ForInStatement);
  });
});

describe('isAwaitExpression', () => {
  it('returns true for await expression', () => {
    const program = parseCode('async function fn() { await promise; }');
    const awaitExpr = findNode<TSESTree.AwaitExpression>(
      program,
      AST_NODE_TYPES.AwaitExpression,
    );
    expect(isAwaitExpression(awaitExpr)).toBe(true);
  });

  it('returns false for non-await expression', () => {
    const program = parseCode('const x = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isAwaitExpression(identifier)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isAwaitExpression(null)).toBe(false);
    expect(isAwaitExpression(undefined)).toBe(false);
  });
});

describe('loopContainsAwait', () => {
  it('finds await in simple expression', () => {
    const program = parseCode(
      'async function fn() { for (const x of items) { await doSomething(x); } }',
    );
    setParentReferences(program);
    const loop = findNode<TSESTree.ForOfStatement>(
      program,
      AST_NODE_TYPES.ForOfStatement,
    )!;
    expect(loopContainsAwait(loop)).toBe(true);
  });

  it('finds await in nested call', () => {
    const program = parseCode(
      'async function fn() { for (const x of items) { console.log(await getData()); } }',
    );
    setParentReferences(program);
    const loop = findNode<TSESTree.ForOfStatement>(
      program,
      AST_NODE_TYPES.ForOfStatement,
    )!;
    expect(loopContainsAwait(loop)).toBe(true);
  });

  it('returns false for sync code', () => {
    const program = parseCode('for (const x of items) { console.log(x); }');
    setParentReferences(program);
    const loop = findNode<TSESTree.ForOfStatement>(
      program,
      AST_NODE_TYPES.ForOfStatement,
    )!;
    expect(loopContainsAwait(loop)).toBe(false);
  });

  it('stops at function boundaries', () => {
    // The await is inside a nested function, not directly in the loop
    const program = parseCode(`
      for (const x of items) {
        const fn = async () => {
          await doSomething();
        };
      }
    `);
    setParentReferences(program);
    const loop = findNode<TSESTree.ForOfStatement>(
      program,
      AST_NODE_TYPES.ForOfStatement,
    )!;
    expect(loopContainsAwait(loop)).toBe(false);
  });

  it('stops at function expression boundaries', () => {
    const program = parseCode(`
      for (const x of items) {
        const fn = async function() {
          await doSomething();
        };
      }
    `);
    setParentReferences(program);
    const loop = findNode<TSESTree.ForOfStatement>(
      program,
      AST_NODE_TYPES.ForOfStatement,
    )!;
    expect(loopContainsAwait(loop)).toBe(false);
  });

  it('stops at function declaration boundaries', () => {
    const program = parseCode(`
      for (const x of items) {
        async function nested() {
          await doSomething();
        }
      }
    `);
    setParentReferences(program);
    const loop = findNode<TSESTree.ForOfStatement>(
      program,
      AST_NODE_TYPES.ForOfStatement,
    )!;
    expect(loopContainsAwait(loop)).toBe(false);
  });
});

describe('isThrowStatement', () => {
  it('returns true for throw statement', () => {
    const program = parseCode('throw new Error("test");');
    const throwStmt = findNode<TSESTree.ThrowStatement>(
      program,
      AST_NODE_TYPES.ThrowStatement,
    );
    expect(isThrowStatement(throwStmt)).toBe(true);
  });

  it('returns false for non-throw statement', () => {
    const program = parseCode('const x = 1;');
    const identifier = findNode<TSESTree.Identifier>(program, AST_NODE_TYPES.Identifier);
    expect(isThrowStatement(identifier)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isThrowStatement(null)).toBe(false);
    expect(isThrowStatement(undefined)).toBe(false);
  });
});

describe('isNewError', () => {
  it('returns true for new Error()', () => {
    const program = parseCode('new Error("test");');
    const newExpr = findNode<TSESTree.NewExpression>(
      program,
      AST_NODE_TYPES.NewExpression,
    )!;
    expect(isNewError(newExpr)).toBe(true);
  });

  it('returns true for new TypeError()', () => {
    const program = parseCode('new TypeError("test");');
    const newExpr = findNode<TSESTree.NewExpression>(
      program,
      AST_NODE_TYPES.NewExpression,
    )!;
    expect(isNewError(newExpr)).toBe(true);
  });

  it('returns true for new RangeError()', () => {
    const program = parseCode('new RangeError("test");');
    const newExpr = findNode<TSESTree.NewExpression>(
      program,
      AST_NODE_TYPES.NewExpression,
    )!;
    expect(isNewError(newExpr)).toBe(true);
  });

  it('returns true for other error types', () => {
    const errorTypes = ['ReferenceError', 'SyntaxError', 'URIError', 'EvalError'];
    for (const errorType of errorTypes) {
      const program = parseCode(`new ${errorType}("test");`);
      const newExpr = findNode<TSESTree.NewExpression>(
        program,
        AST_NODE_TYPES.NewExpression,
      )!;
      expect(isNewError(newExpr)).toBe(true);
    }
  });

  it('returns false for non-error new expression', () => {
    const program = parseCode('new Date();');
    const newExpr = findNode<TSESTree.NewExpression>(
      program,
      AST_NODE_TYPES.NewExpression,
    )!;
    expect(isNewError(newExpr)).toBe(false);
  });

  it('returns false for non-new expression', () => {
    const program = parseCode('Error("test");');
    const callExpr = findNode<TSESTree.CallExpression>(
      program,
      AST_NODE_TYPES.CallExpression,
    )!;
    expect(isNewError(callExpr as any)).toBe(false);
  });
});

describe('getStringValue', () => {
  it('returns value for string literal', () => {
    const program = parseCode('"hello";');
    const literal = findNode<TSESTree.Literal>(program, AST_NODE_TYPES.Literal)!;
    expect(getStringValue(literal)).toBe('hello');
  });

  it('returns value for simple template literal', () => {
    const program = parseCode('`hello`;');
    const templateLiteral = findNode<TSESTree.TemplateLiteral>(
      program,
      AST_NODE_TYPES.TemplateLiteral,
    )!;
    expect(getStringValue(templateLiteral)).toBe('hello');
  });

  it('returns undefined for template literal with expressions', () => {
    const program = parseCode('`hello ${name}`;');
    const templateLiteral = findNode<TSESTree.TemplateLiteral>(
      program,
      AST_NODE_TYPES.TemplateLiteral,
    )!;
    expect(getStringValue(templateLiteral)).toBeUndefined();
  });

  it('returns undefined for number literal', () => {
    const program = parseCode('42;');
    const literal = findNode<TSESTree.Literal>(program, AST_NODE_TYPES.Literal)!;
    expect(getStringValue(literal)).toBeUndefined();
  });

  it('returns undefined for null/undefined', () => {
    expect(getStringValue(null)).toBeUndefined();
    expect(getStringValue(undefined)).toBeUndefined();
  });
});

describe('hasProperty', () => {
  it('returns true when property exists with identifier key', () => {
    const program = parseCode('const obj = { foo: 1 };');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    expect(hasProperty(objExpr, 'foo')).toBe(true);
  });

  it('returns true when property exists with string literal key', () => {
    const program = parseCode('const obj = { "foo": 1 };');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    expect(hasProperty(objExpr, 'foo')).toBe(true);
  });

  it('returns false when property does not exist', () => {
    const program = parseCode('const obj = { foo: 1 };');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    expect(hasProperty(objExpr, 'bar')).toBe(false);
  });

  it('returns false for empty object', () => {
    const program = parseCode('const obj = {};');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    expect(hasProperty(objExpr, 'foo')).toBe(false);
  });

  it('ignores spread elements', () => {
    const program = parseCode('const obj = { ...other };');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    expect(hasProperty(objExpr, 'foo')).toBe(false);
  });
});

describe('getProperty', () => {
  it('returns property when exists with identifier key', () => {
    const program = parseCode('const obj = { foo: 1 };');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    const prop = getProperty(objExpr, 'foo');
    expect(prop).toBeDefined();
    expect(prop?.type).toBe(AST_NODE_TYPES.Property);
  });

  it('returns property when exists with string literal key', () => {
    const program = parseCode('const obj = { "foo": 1 };');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    const prop = getProperty(objExpr, 'foo');
    expect(prop).toBeDefined();
  });

  it('returns undefined when property does not exist', () => {
    const program = parseCode('const obj = { foo: 1 };');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    expect(getProperty(objExpr, 'bar')).toBeUndefined();
  });

  it('returns undefined for empty object', () => {
    const program = parseCode('const obj = {};');
    const objExpr = findNode<TSESTree.ObjectExpression>(
      program,
      AST_NODE_TYPES.ObjectExpression,
    )!;
    expect(getProperty(objExpr, 'foo')).toBeUndefined();
  });
});
