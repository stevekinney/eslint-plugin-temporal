import { readdirSync, readFileSync } from 'node:fs';

const rulesFile = readFileSync('src/rules/index.ts', 'utf8');
const ruleNames = [...rulesFile.matchAll(/'([^']+)':/g)]
  .map((match) => match[1])
  .filter((rule): rule is string => Boolean(rule));

const docsDir = 'documentation/rules';
const docFiles = readdirSync(docsDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace(/\.md$/, ''));

const missingDocs = ruleNames.filter((rule) => !docFiles.includes(rule));
const extraDocs = docFiles.filter((doc) => !ruleNames.includes(doc));

const readme = readFileSync('README.md', 'utf8');
const missingInReadme = ruleNames.filter((rule) => !readme.includes(rule));

const problems: string[] = [];

if (missingDocs.length) {
  problems.push(`Missing rule docs: ${missingDocs.join(', ')}`);
}

if (extraDocs.length) {
  problems.push(`Extra rule docs without rules: ${extraDocs.join(', ')}`);
}

if (missingInReadme.length) {
  problems.push(`README missing rule names: ${missingInReadme.join(', ')}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log('Docs check passed.');
