/**
 * @module .claude/hooks/format-and-lint
 *
 * Claude Code `PostToolUse` hook for the Edit and Write tools. After Claude
 * changes a file, it formats that file with Prettier and auto-fixes it with
 * ESLint, so style problems are fixed straight away instead of failing in CI.
 *
 * If ESLint still reports errors, the hook exits with code 2. Claude Code then
 * shows the errors to Claude, which fixes them. Files outside the project,
 * inside node_modules, or of other types are ignored.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** File types Prettier formats. */
const PRETTIER_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.css',
  '.html',
  '.yml',
  '.yaml',
]);

/** File types ESLint checks. */
const ESLINT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

/**
 * Reads all of stdin as a UTF-8 string.
 *
 * @returns The raw hook payload.
 */
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

let payload;
try {
  payload = JSON.parse(await readStdin());
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== 'string') process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const absolute = path.resolve(root, filePath);
const relative = path.relative(root, absolute);

const outsideProject = relative.startsWith('..') || path.isAbsolute(relative);
if (outsideProject || relative.split(path.sep).includes('node_modules')) process.exit(0);
if (!fs.existsSync(absolute)) process.exit(0);

/**
 * Path of a locally installed CLI, e.g. `node_modules/.bin/prettier`.
 *
 * @param name - The binary name.
 * @returns The absolute path to the binary.
 */
const bin = (name) => path.join(root, 'node_modules', '.bin', name);

const extension = path.extname(absolute).toLowerCase();

if (PRETTIER_EXTENSIONS.has(extension) && fs.existsSync(bin('prettier'))) {
  spawnSync(bin('prettier'), ['--write', '--log-level', 'warn', absolute], {
    cwd: root,
    encoding: 'utf8',
  });
}

if (ESLINT_EXTENSIONS.has(extension) && fs.existsSync(bin('eslint'))) {
  const result = spawnSync(bin('eslint'), ['--fix', '--no-warn-ignored', absolute], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(`ESLint found problems in ${relative}:\n${result.stdout}${result.stderr}`);
    process.exit(2);
  }
}

process.exit(0);
