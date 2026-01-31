import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/**
 * Find the position to insert a new import statement
 * (after existing imports, or at the start of the file)
 */
export function findImportInsertPosition(sourceCode: TSESLint.SourceCode): number {
  const program = sourceCode.ast;
  let lastImportEnd = 0;

  for (const node of program.body) {
    if (node.type === AST_NODE_TYPES.ImportDeclaration) {
      lastImportEnd = node.range[1];
    } else {
      // Stop at first non-import
      break;
    }
  }

  return lastImportEnd;
}

/**
 * Check if an import declaration already exists for a source
 */
export function findExistingImport(
  sourceCode: TSESLint.SourceCode,
  source: string,
): TSESTree.ImportDeclaration | undefined {
  const program = sourceCode.ast;

  for (const node of program.body) {
    if (node.type === AST_NODE_TYPES.ImportDeclaration && node.source.value === source) {
      return node;
    }
  }

  return undefined;
}

/**
 * Generate a fixer that adds a specifier to an existing import
 */
export function addSpecifierToImport(
  fixer: TSESLint.RuleFixer,
  importNode: TSESTree.ImportDeclaration,
  specifier: string,
  sourceCode: TSESLint.SourceCode,
): TSESLint.RuleFix {
  // Find the position to insert the new specifier
  const lastSpecifier = importNode.specifiers.at(-1);

  if (!lastSpecifier) {
    // No specifiers, transform `import 'source'` to `import { specifier } from 'source'`
    const fromKeyword = sourceCode.getTokenBefore(importNode.source);
    if (fromKeyword) {
      return fixer.insertTextBefore(fromKeyword, `{ ${specifier} } `);
    }
    // Fallback: insert after import keyword
    const importKeyword = sourceCode.getFirstToken(importNode);
    if (importKeyword) {
      return fixer.insertTextAfter(importKeyword, ` { ${specifier} }`);
    }
  }

  // Check if it's a namespace import
  if (lastSpecifier && lastSpecifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
    // Can't add to namespace import, need a new import
    throw new Error('Cannot add specifier to namespace import');
  }

  // Find the closing brace of existing specifiers
  const closingBrace = sourceCode.getTokenAfter(
    lastSpecifier!,
    (token) => token.value === '}',
  );

  if (closingBrace) {
    // Check if there's whitespace between the last specifier and closing brace
    const textBeforeBrace = sourceCode
      .getText()
      .slice(lastSpecifier!.range[1], closingBrace.range[0]);
    const hasSpaceBefore = /\s/.test(textBeforeBrace);

    if (hasSpaceBefore) {
      // Replace the space + brace with ", specifier }"
      // e.g., "Context }" -> "Context, log }"
      return fixer.replaceTextRange(
        [lastSpecifier!.range[1], closingBrace.range[1]],
        `, ${specifier} }`,
      );
    } else {
      // No space, just insert before brace
      return fixer.insertTextBefore(closingBrace, `, ${specifier}`);
    }
  }

  // If we have default import but no named imports
  if (lastSpecifier && lastSpecifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
    return fixer.insertTextAfter(lastSpecifier, `, { ${specifier} }`);
  }

  throw new Error('Could not find position to insert specifier');
}

/**
 * Generate a fixer that adds a new import statement
 */
export function addNewImport(
  fixer: TSESLint.RuleFixer,
  sourceCode: TSESLint.SourceCode,
  source: string,
  specifiers: string[],
): TSESLint.RuleFix {
  const insertPosition = findImportInsertPosition(sourceCode);
  const specifierStr = specifiers.join(', ');
  const importStatement = `import { ${specifierStr} } from '${source}';\n`;

  if (insertPosition === 0) {
    // No existing imports, insert at start
    return fixer.insertTextBeforeRange([0, 0], importStatement);
  }

  return fixer.insertTextAfterRange(
    [insertPosition, insertPosition],
    '\n' + importStatement.trimEnd(),
  );
}

/**
 * Generate fixers that ensure a specifier is imported from a source
 * Returns an array of fixes
 */
export function* ensureImport(
  fixer: TSESLint.RuleFixer,
  sourceCode: TSESLint.SourceCode,
  source: string,
  specifier: string,
): Generator<TSESLint.RuleFix> {
  const program = sourceCode.ast;
  let valueImport: TSESTree.ImportDeclaration | undefined;
  let typeOnlyImport: TSESTree.ImportDeclaration | undefined;

  for (const node of program.body) {
    if (node.type !== AST_NODE_TYPES.ImportDeclaration || node.source.value !== source) {
      continue;
    }

    if (node.importKind === 'type') {
      typeOnlyImport ??= node;
    } else {
      valueImport ??= node;
    }
  }

  const existingImport = valueImport ?? typeOnlyImport;

  if (existingImport) {
    // Check if specifier already exists
    const hasValueSpecifier =
      existingImport.importKind !== 'type' &&
      existingImport.specifiers.some(
        (s) =>
          s.type === AST_NODE_TYPES.ImportSpecifier &&
          s.importKind !== 'type' &&
          ((s.imported.type === AST_NODE_TYPES.Identifier &&
            s.imported.name === specifier) ||
            (s.imported.type === AST_NODE_TYPES.Literal &&
              s.imported.value === specifier)),
      );

    if (!hasValueSpecifier) {
      if (existingImport.importKind === 'type') {
        yield addNewImport(fixer, sourceCode, source, [specifier]);
        return;
      }

      try {
        yield addSpecifierToImport(fixer, existingImport, specifier, sourceCode);
      } catch {
        // If we can't add to existing import, add a new one
        yield addNewImport(fixer, sourceCode, source, [specifier]);
      }
    }
  } else {
    yield addNewImport(fixer, sourceCode, source, [specifier]);
  }
}

/**
 * Check if a specifier already exists in a source's imports
 */
export function hasSpecifier(
  sourceCode: TSESLint.SourceCode,
  source: string,
  specifier: string,
): boolean {
  const existingImport = findExistingImport(sourceCode, source);
  if (!existingImport) return false;

  return existingImport.specifiers.some(
    (s) =>
      s.type === AST_NODE_TYPES.ImportSpecifier &&
      ((s.imported.type === AST_NODE_TYPES.Identifier && s.imported.name === specifier) ||
        (s.imported.type === AST_NODE_TYPES.Literal && s.imported.value === specifier)),
  );
}
