import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { SourceCode } from '@typescript-eslint/utils/ts-eslint';
import { describe, expect, it } from 'bun:test';

import {
  addNewImport,
  addSpecifierToImport,
  ensureImport,
  findExistingImport,
  findImportInsertPosition,
  hasSpecifier,
} from './import-fixer.ts';

// Helper to create a mock source code from text
function createMockSourceCode(code: string): TSESLint.SourceCode {
  const ast = parse(code, {
    range: true,
    loc: true,
    tokens: true,
    comment: true,
  });

  // Create SourceCode with all required properties
  return new SourceCode({
    text: code,
    ast: ast as any,
    parserServices: null,
    scopeManager: null as any,
    visitorKeys: null as any,
  }) as unknown as TSESLint.SourceCode;
}

// Mock fixer for testing
class MockFixer implements TSESLint.RuleFixer {
  public fixes: Array<{ type: string; text: string; range?: [number, number] }> = [];

  insertTextAfter(
    _nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string,
  ): TSESLint.RuleFix {
    this.fixes.push({ type: 'insertTextAfter', text });
    return { range: [0, 0], text } as TSESLint.RuleFix;
  }

  insertTextAfterRange(range: [number, number], text: string): TSESLint.RuleFix {
    this.fixes.push({ type: 'insertTextAfterRange', text, range });
    return { range, text } as TSESLint.RuleFix;
  }

  insertTextBefore(
    _nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string,
  ): TSESLint.RuleFix {
    this.fixes.push({ type: 'insertTextBefore', text });
    return { range: [0, 0], text } as TSESLint.RuleFix;
  }

  insertTextBeforeRange(range: [number, number], text: string): TSESLint.RuleFix {
    this.fixes.push({ type: 'insertTextBeforeRange', text, range });
    return { range, text } as TSESLint.RuleFix;
  }

  remove(_nodeOrToken: TSESTree.Node | TSESTree.Token): TSESLint.RuleFix {
    this.fixes.push({ type: 'remove', text: '' });
    return { range: [0, 0], text: '' } as TSESLint.RuleFix;
  }

  removeRange(range: [number, number]): TSESLint.RuleFix {
    this.fixes.push({ type: 'removeRange', text: '', range });
    return { range, text: '' } as TSESLint.RuleFix;
  }

  replaceText(
    _nodeOrToken: TSESTree.Node | TSESTree.Token,
    text: string,
  ): TSESLint.RuleFix {
    this.fixes.push({ type: 'replaceText', text });
    return { range: [0, 0], text } as TSESLint.RuleFix;
  }

  replaceTextRange(range: [number, number], text: string): TSESLint.RuleFix {
    this.fixes.push({ type: 'replaceTextRange', text, range });
    return { range, text } as TSESLint.RuleFix;
  }
}

describe('findImportInsertPosition', () => {
  it('returns 0 when no imports exist', () => {
    const sourceCode = createMockSourceCode('const x = 1;');
    expect(findImportInsertPosition(sourceCode)).toBe(0);
  });

  it('returns position after last import', () => {
    const code = `import { foo } from 'foo';
import { bar } from 'bar';
const x = 1;`;
    const sourceCode = createMockSourceCode(code);
    const pos = findImportInsertPosition(sourceCode);
    // Position should be after the second import
    expect(pos).toBeGreaterThan(0);
  });

  it('returns position after single import', () => {
    const code = `import { foo } from 'foo';
const x = 1;`;
    const sourceCode = createMockSourceCode(code);
    const pos = findImportInsertPosition(sourceCode);
    expect(pos).toBeGreaterThan(0);
  });

  it('stops at first non-import statement', () => {
    const code = `import { foo } from 'foo';
const x = 1;
import { bar } from 'bar';`; // This import is not at top
    const sourceCode = createMockSourceCode(code);
    const pos = findImportInsertPosition(sourceCode);
    // Position should be after the first import, not the second
    expect(pos).toBeLessThan(code.lastIndexOf('import'));
  });
});

describe('findExistingImport', () => {
  it('finds import when it exists', () => {
    const sourceCode = createMockSourceCode(
      `import { foo } from '@temporalio/workflow';`,
    );
    const importDecl = findExistingImport(sourceCode, '@temporalio/workflow');
    expect(importDecl).toBeDefined();
    expect(importDecl?.source.value).toBe('@temporalio/workflow');
  });

  it('returns undefined when import does not exist', () => {
    const sourceCode = createMockSourceCode(`import { foo } from 'other';`);
    const importDecl = findExistingImport(sourceCode, '@temporalio/workflow');
    expect(importDecl).toBeUndefined();
  });

  it('returns undefined for empty file', () => {
    const sourceCode = createMockSourceCode('const x = 1;');
    const importDecl = findExistingImport(sourceCode, '@temporalio/workflow');
    expect(importDecl).toBeUndefined();
  });
});

describe('hasSpecifier', () => {
  it('returns true when specifier exists', () => {
    const sourceCode = createMockSourceCode(
      `import { proxyActivities, sleep } from '@temporalio/workflow';`,
    );
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'proxyActivities')).toBe(
      true,
    );
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'sleep')).toBe(true);
  });

  it('returns false when specifier does not exist', () => {
    const sourceCode = createMockSourceCode(
      `import { proxyActivities } from '@temporalio/workflow';`,
    );
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'sleep')).toBe(false);
  });

  it('returns false when import does not exist', () => {
    const sourceCode = createMockSourceCode(`import { foo } from 'other';`);
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'proxyActivities')).toBe(
      false,
    );
  });

  it('returns false for empty file', () => {
    const sourceCode = createMockSourceCode('const x = 1;');
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'proxyActivities')).toBe(
      false,
    );
  });

  it('handles renamed imports', () => {
    const sourceCode = createMockSourceCode(
      `import { proxyActivities as createActivities } from '@temporalio/workflow';`,
    );
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'proxyActivities')).toBe(
      true,
    );
  });
});

describe('addNewImport', () => {
  it('creates import at start when no existing imports', () => {
    const sourceCode = createMockSourceCode('const x = 1;');
    const fixer = new MockFixer();

    addNewImport(fixer, sourceCode, '@temporalio/workflow', ['proxyActivities']);

    expect(fixer.fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain(
      "import { proxyActivities } from '@temporalio/workflow'",
    );
    expect(fixer.fixes[0]?.type).toBe('insertTextBeforeRange');
  });

  it('creates import after existing imports', () => {
    const sourceCode = createMockSourceCode(`import { foo } from 'foo';
const x = 1;`);
    const fixer = new MockFixer();

    addNewImport(fixer, sourceCode, '@temporalio/workflow', ['proxyActivities']);

    expect(fixer.fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain(
      "import { proxyActivities } from '@temporalio/workflow'",
    );
    expect(fixer.fixes[0]?.type).toBe('insertTextAfterRange');
  });

  it('handles multiple specifiers', () => {
    const sourceCode = createMockSourceCode('const x = 1;');
    const fixer = new MockFixer();

    addNewImport(fixer, sourceCode, '@temporalio/workflow', [
      'proxyActivities',
      'sleep',
      'log',
    ]);

    expect(fixer.fixes[0]?.text).toContain(
      "import { proxyActivities, sleep, log } from '@temporalio/workflow'",
    );
  });
});

describe('addSpecifierToImport', () => {
  it('adds specifier to existing import with named imports', () => {
    const code = `import { proxyActivities } from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();
    const importNode = findExistingImport(sourceCode, '@temporalio/workflow')!;

    addSpecifierToImport(fixer, importNode, 'sleep', sourceCode);

    expect(fixer.fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain('sleep');
  });

  it('adds specifier after default import', () => {
    const code = `import workflow from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();
    const importNode = findExistingImport(sourceCode, '@temporalio/workflow')!;

    addSpecifierToImport(fixer, importNode, 'sleep', sourceCode);

    expect(fixer.fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain('{ sleep }');
  });

  it('throws for namespace import', () => {
    const code = `import * as workflow from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();
    const importNode = findExistingImport(sourceCode, '@temporalio/workflow')!;

    expect(() => {
      addSpecifierToImport(fixer, importNode, 'sleep', sourceCode);
    }).toThrow('Cannot add specifier to namespace import');
  });

  it('handles import with no specifiers (side-effect only)', () => {
    const code = `import '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();
    const importNode = findExistingImport(sourceCode, '@temporalio/workflow')!;

    addSpecifierToImport(fixer, importNode, 'sleep', sourceCode);

    expect(fixer.fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain('sleep');
  });
});

describe('ensureImport', () => {
  it('adds new import when none exists', () => {
    const sourceCode = createMockSourceCode('const x = 1;');
    const fixer = new MockFixer();

    const fixes = [...ensureImport(fixer, sourceCode, '@temporalio/workflow', 'log')];

    expect(fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain("import { log } from '@temporalio/workflow'");
  });

  it('adds specifier to existing import', () => {
    const code = `import { proxyActivities } from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();

    const fixes = [...ensureImport(fixer, sourceCode, '@temporalio/workflow', 'log')];

    expect(fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain('log');
  });

  it('skips if specifier already exists', () => {
    const code = `import { proxyActivities, log } from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();

    const fixes = [...ensureImport(fixer, sourceCode, '@temporalio/workflow', 'log')];

    expect(fixes).toHaveLength(0);
  });

  it('creates new value import when only type import exists', () => {
    const code = `import type { WorkflowInfo } from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();

    const fixes = [...ensureImport(fixer, sourceCode, '@temporalio/workflow', 'log')];

    expect(fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain("import { log } from '@temporalio/workflow'");
  });

  it('falls back to new import when cannot add to namespace import', () => {
    const code = `import * as wf from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();

    const fixes = [...ensureImport(fixer, sourceCode, '@temporalio/workflow', 'log')];

    // Should fall back to creating a new import
    expect(fixes).toHaveLength(1);
    expect(fixer.fixes[0]?.text).toContain("import { log } from '@temporalio/workflow'");
  });

  it('handles mixed value and type imports from same source', () => {
    const code = `import type { WorkflowInfo } from '@temporalio/workflow';
import { proxyActivities } from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();

    const fixes = [...ensureImport(fixer, sourceCode, '@temporalio/workflow', 'log')];

    expect(fixes).toHaveLength(1);
    // Should add to the value import, not the type import
    expect(fixer.fixes[0]?.text).toContain('log');
    expect(fixer.fixes[0]?.type).not.toBe('insertTextBeforeRange'); // Not a new import
  });

  it('skips if value specifier already exists in mixed imports', () => {
    const code = `import type { WorkflowInfo } from '@temporalio/workflow';
import { proxyActivities, log } from '@temporalio/workflow';`;
    const sourceCode = createMockSourceCode(code);
    const fixer = new MockFixer();

    const fixes = [...ensureImport(fixer, sourceCode, '@temporalio/workflow', 'log')];

    expect(fixes).toHaveLength(0);
  });
});

// Integration tests using real rule tester
describe('import-fixer integration', () => {
  it('handles real-world import scenarios', () => {
    // This test verifies that the functions work together in realistic scenarios
    const code = `
import { proxyActivities } from '@temporalio/workflow';

export async function myWorkflow() {
  const activities = proxyActivities();
}
`;
    const sourceCode = createMockSourceCode(code);

    // Verify we can find the import
    const importNode = findExistingImport(sourceCode, '@temporalio/workflow');
    expect(importNode).toBeDefined();

    // Verify specifier detection works
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'proxyActivities')).toBe(
      true,
    );
    expect(hasSpecifier(sourceCode, '@temporalio/workflow', 'log')).toBe(false);
  });
});
