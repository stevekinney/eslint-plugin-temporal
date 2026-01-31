## Plugin shape and packaging

A good ESLint plugin is a _package of lint behavior_—rules, configs, processors, and sometimes language support. Treat the plugin export as an API surface you’ll have to maintain.

- Export a proper plugin object—`rules`, optionally `configs`, `processors`, and a plugin-level `meta` object. ESLint recommends `meta.name`, `meta.version`, and `meta.namespace` for caching/debuggability, and the namespace should match what users type before `/rule-name`. ([ESLint][1])
- Use a correct npm naming scheme—`eslint-plugin-foo` or `@scope/eslint-plugin-foo` (or `@scope/eslint-plugin`). ([ESLint][1])
- Keep rule IDs simple—inside `rules`, keys must _not_ contain `/` (the slash belongs between the namespace and the rule name in config usage). ([ESLint][1])
- Ship at least one config—most plugins should expose a `recommended` config so users can adopt your plugin without turning on 37 switches. ESLint supports bundling configs under `configs`. ([ESLint][1])
- Design for flat config first—modern ESLint expects `eslint.config.*` and “plugins as imported objects” patterns. Your docs/examples should reflect that. ([ESLint][1])
- If you provide processors (Markdown, custom file extraction, etc.), include processor meta too (`name`, `version`) and keep preprocess/postprocess deterministic. ([ESLint][2])
- Lint your linter—ESLint explicitly suggests linting plugins with `eslint`, `eslint-plugin-eslint-plugin`, and `eslint-plugin-n`, and adding keywords (`eslint`, `eslintplugin`, `eslint-plugin`) to `package.json` for discoverability. ([ESLint][1])

A minimal plugin skeleton (flat-config friendly) looks like:

```js
// index.js (or index.ts compiled)
const plugin = {
  meta: { name: 'eslint-plugin-example', version: '1.2.3', namespace: 'example' },
  rules: {
    'my-rule': require('./rules/my-rule'),
  },
  configs: {
    recommended: [
      {
        plugins: { example: null /* assigned below */ },
        rules: { 'example/my-rule': 'error' },
      },
    ],
  },
};

// let the config reference the plugin object (ESLint docs show Object.assign)
plugin.configs.recommended[0].plugins.example = plugin;

module.exports = plugin;
```

## Rule design and metadata

Rules are the product. Optimize for correctness, clarity, and _not being annoying_.

- Use object-style rules with `create(context)`—function-style rules are gone in ESLint v9+. ([ESLint][3])
- Fill in `meta` completely—`type` (`"problem" | "suggestion" | "layout"`), `docs.description`, `messages`, `schema`, and fixer/suggestion flags when relevant. ESLint shows this as the canonical structure. ([ESLint][4])
- Prefer `messageId` over inline `message`—centralizing messages in `meta.messages` avoids duplication and makes future edits far less painful. ([ESLint][4])
- Don’t extend core rules as a dependency—ESLint warns core rules aren’t a stable public API. If you need similar behavior, copy and adapt. ([ESLint][4])
- Follow established naming conventions—mirroring ESLint core naming patterns makes rules easier to understand and search for (“no-…”, “prefer-…”, etc.). ([ESLint][4])

A solid rule “shape” (even before the logic) is:

```js
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Explain what the rule detects and why it matters.' },
    schema: [],
    messages: {
      badThing: 'Explain the issue tersely and precisely.',
    },
  },
  create(context) {
    return {
      Identifier(node) {
        // ...
        context.report({ node, messageId: 'badThing' });
      },
    };
  },
};
```

## Options and schemas

Options are where plugins go to die—unless you treat them like a real contract.

- Always define `meta.schema` for any rule that accepts options—ESLint v9 throws if options are passed to a rule without a schema. ([ESLint][3])
- Prefer “no options” to mean `schema: []`—and if a rule expects options, describe them with JSON Schema so ESLint can validate user configs and you can assume sane inputs. ([ESLint][3])
- Provide logical defaults even when options exist—ESLint calls this out explicitly; treat absent options as a supported mode, not an error path. ([ESLint][4])
- Keep options stable—adding optional properties is fine; changing defaults or semantics is a breaking change. Version accordingly.

## Reporting, fixes, and suggestions

This is the part that directly affects developer trust. It’s also where you can accidentally build a foot-gun.

- Use `context.report()` correctly—at minimum include `node` or `loc`, prefer `messageId`, and use `data` for placeholders. ([ESLint][4])
- Autofix only when it’s clearly safe—ESLint notes fixes may conflict and may not be applied; design fixes to be small and unambiguous. ([ESLint][4])
- If you provide fixes, set `meta.fixable` to `"code"` or `"whitespace"`—ESLint v8+ enforces this. ([ESLint][5])
- If you provide suggestions, set `meta.hasSuggestions: true`—otherwise ESLint errors. ([ESLint][5])
- Keep suggestions surgical—ESLint recommends suggestions not attempt big refactors and not try to match user formatting preferences (let multipass autofix/formatters handle style). ([ESLint][4])
- Ensure suggestions are well-formed—newer RuleTester behavior is stricter (unique suggestion messages per problem, suggestions must produce valid syntax). ([ESLint][6])

## Testing strategy

Treat rule behavior like a compiler feature: it needs regression tests.

- Use `RuleTester` for every rule—ESLint explicitly provides it for plugin testing. ([ESLint][4])
- Test the rule, the options contract, and the fixer output—your tests should cover valid cases, invalid cases, different option combos, and fix output (including “no fix when ambiguous”).
- Update tests for ESLint v9 semantics—`RuleTester` defaults changed (flat-config defaults like `sourceType: "module"` and `ecmaVersion: "latest"`), and language options moved from `parserOptions` to `languageOptions`. ([ESLint][3])
- Add “false positive” tests—every serious rule should include examples that look similar but must not be flagged (this is how you keep rules from becoming noisy).

## TypeScript support

If you lint TS, do it the TypeScript-ESLint way, not the “hand-wave and pray” way.

- Use `@typescript-eslint/utils` when writing TS-aware rules—its types match TypeScript-ESLint nodes, unlike `@types/eslint` which is ESTree-focused. ([TypeScript ESLint][7])
- Prefer `ESLintUtils.RuleCreator`—it gives typed `messageId`s inferred from `meta.messages` and encourages a documentation URL convention. ([TypeScript ESLint][7])
- Use the TypeScript-ESLint RuleTester (`@typescript-eslint/rule-tester`) for TS rules—it’s built for TS parsing and services. ([TypeScript ESLint][7])
- Only use type-checker APIs when you truly need them—typed rules are powerful but slower and more brittle across TS versions. Keep a clean separation between syntax-only and type-aware rules.

## Performance and determinism

Lint runs _all the time_. Any waste is multiplied by every file, every save, every CI run.

- Prefer narrow AST selectors and early exits—most performance wins come from “don’t do work.”
- Avoid heavyweight operations inside visitors—no filesystem reads, network calls, or cross-file scanning in a rule pass. Keep rules pure and deterministic.
- Measure rule cost with ESLint’s built-in timing—`TIMING=1 eslint …` surfaces the slowest rules; use it while developing and before releases. ([ESLint][4])
- Don’t use deprecated `SourceCode` APIs—RuleTester started failing on deprecated methods in v8 and removals follow. ([ESLint][5])

## Documentation and developer experience

If the rule is “correct” but nobody understands it, it’s still a net loss.

- Document every rule—what it enforces, why it exists, when to disable it, and examples of good/bad code. The TypeScript-ESLint docs even call out that undocumented rules are generally not recommended. ([TypeScript ESLint][7])
- Include configuration examples for flat config (`eslint.config.js`)—ESLint’s plugin docs show the modern import/namespace pattern; mirror that. ([ESLint][1])
- Provide a `recommended` config and clearly mark what’s in it—users adopt plugins through configs, not through spelunking rule lists. ([ESLint][1])
- Make messages actionable—state the problem, not just “don’t.” When possible, include the _intent_ (“Use X because Y”), and provide a safe fixer or a suggestion. ([ESLint][4])

## Release hygiene and compatibility

This is the boring stuff that keeps the plugin alive.

- Declare supported ESLint versions explicitly—use `peerDependencies` and test against the range you claim. ESLint’s rule-writing surface changes across majors (v8/v9 examples above are real breaking points). ([ESLint][3])
- Version based on behavior—changing defaults, adding new reports, or altering fixer output can be breaking for CI pipelines. Use semver like you mean it.
- Keep examples and docs current—especially around config format and RuleTester APIs (flat config is the default path now). ([ESLint][8])

---

A neat meta-best-practice: run `eslint-plugin-eslint-plugin` on your plugin during CI. It’s basically “linting for linter authors,” and ESLint itself explicitly recommends it as part of plugin linting. ([ESLint][1])

[1]: https://eslint.org/docs/latest/extend/plugins 'Create Plugins - ESLint - Pluggable JavaScript Linter'
[2]: https://eslint.org/docs/latest/extend/custom-processors 'Custom Processors - ESLint - Pluggable JavaScript Linter'
[3]: https://eslint.org/docs/latest/use/migrate-to-9.0.0 'Migrate to v9.x - ESLint - Pluggable JavaScript Linter'
[4]: https://eslint.org/docs/latest/extend/custom-rules 'Custom Rules - ESLint - Pluggable JavaScript Linter'
[5]: https://eslint.org/docs/latest/use/migrate-to-8.0.0 'Migrate to v8.0.0 - ESLint - Pluggable JavaScript Linter'
[6]: https://eslint.org/blog/2023/12/eslint-v9.0.0-alpha.0-released/ 'ESLint v9.0.0-alpha.0 released - ESLint - Pluggable JavaScript Linter'
[7]: https://typescript-eslint.io/developers/custom-rules 'Custom Rules | typescript-eslint'
[8]: https://eslint.org/docs/latest/use/configure/configuration-files 'Configuration Files - ESLint - Pluggable JavaScript Linter'
