import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '_template-backup/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Server: Node.js
  {
    files: ['server/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // Claude Code hook scripts: plain Node.js
  {
    files: ['.claude/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },

  // The conversation engine must stay pure (see CLAUDE.md): no Express, no I/O,
  // and no imports from the outer layers that wrap it.
  {
    files: ['server/src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'express',
              message: 'The engine must not depend on Express. Keep HTTP code in routes/.',
            },
            ...['fs', 'node:fs', 'fs/promises', 'node:fs/promises', 'http', 'node:http'].map(
              (name) => ({
                name,
                message: 'The engine must stay pure (no I/O). Pass data in as arguments.',
              }),
            ),
          ],
          patterns: [
            {
              group: ['**/routes/**', '**/middleware/**', '**/services/**'],
              message: 'The engine must not import from the layers that call it.',
            },
          ],
        },
      ],
    },
  },

  // Client: browser + React
  {
    files: ['client/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Project-wide rules
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // Must be last: turns off rules that conflict with Prettier
  prettier,
);
