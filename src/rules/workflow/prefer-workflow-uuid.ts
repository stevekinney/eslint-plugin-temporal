import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ensureImport } from '../../utilities/import-fixer.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'preferWorkflowUuid';

export const preferWorkflowUuid = createWorkflowRule<[], MessageIds>({
  name: 'workflow-prefer-workflow-uuid',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prefer uuid4() from @temporalio/workflow over other UUID libraries.',
    },
    messages: {
      preferWorkflowUuid:
        "Use uuid4() from '@temporalio/workflow' instead of {{ source }}. Temporal's uuid4() is deterministic and safe for workflow replay.",
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const uuidImports = new Map<string, string>(); // local name -> import source

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // Track uuid imports
        if (source === 'uuid') {
          for (const spec of node.specifiers) {
            if (
              spec.type === AST_NODE_TYPES.ImportSpecifier &&
              spec.imported.type === AST_NODE_TYPES.Identifier
            ) {
              // v4, v1, etc.
              if (spec.imported.name.match(/^v[1-7]$/)) {
                uuidImports.set(spec.local.name, 'uuid');
              }
            } else if (spec.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
              // import uuid from 'uuid'
              uuidImports.set(spec.local.name, 'uuid');
            } else if (spec.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
              // import * as uuid from 'uuid'
              uuidImports.set(spec.local.name, 'uuid');
            }
          }
        }

        // Track nanoid imports
        if (source === 'nanoid') {
          for (const spec of node.specifiers) {
            if (spec.type === AST_NODE_TYPES.ImportSpecifier) {
              uuidImports.set(spec.local.name, 'nanoid');
            } else if (spec.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
              uuidImports.set(spec.local.name, 'nanoid');
            }
          }
        }

        // Track crypto.randomUUID
        if (source === 'crypto' || source === 'node:crypto') {
          for (const spec of node.specifiers) {
            if (
              spec.type === AST_NODE_TYPES.ImportSpecifier &&
              spec.imported.type === AST_NODE_TYPES.Identifier &&
              spec.imported.name === 'randomUUID'
            ) {
              uuidImports.set(spec.local.name, 'crypto');
            }
          }
        }
      },

      CallExpression(node) {
        let source: string | undefined;
        let shouldFix = false;

        // Check for uuid.v4() or v4()
        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const { object, property } = node.callee;

          if (
            object.type === AST_NODE_TYPES.Identifier &&
            property.type === AST_NODE_TYPES.Identifier
          ) {
            // uuid.v4(), uuid.v1(), etc.
            if (
              uuidImports.get(object.name) === 'uuid' &&
              property.name.match(/^v[1-7]$/)
            ) {
              source = `uuid.${property.name}()`;
              shouldFix = true;
            }
          }
        } else if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const calleeName = node.callee.name;

          // v4() from uuid
          if (uuidImports.has(calleeName)) {
            source = `${calleeName}() from ${uuidImports.get(calleeName)}`;
            shouldFix = true;
          }

          // crypto.randomUUID()
          if (calleeName === 'randomUUID' && uuidImports.has('randomUUID')) {
            source = 'crypto.randomUUID()';
            shouldFix = true;
          }
        }

        // Check for crypto.randomUUID() directly
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === 'crypto' &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === 'randomUUID'
        ) {
          source = 'crypto.randomUUID()';
          shouldFix = true;
        }

        if (source && shouldFix) {
          context.report({
            node,
            messageId: 'preferWorkflowUuid',
            data: { source },
            *fix(fixer) {
              // Replace the call with uuid4()
              yield fixer.replaceText(node, 'uuid4()');

              // Ensure uuid4 is imported
              yield* ensureImport(fixer, sourceCode, TEMPORAL_PACKAGES.workflow, 'uuid4');
            },
          });
        }
      },
    };
  },
});
