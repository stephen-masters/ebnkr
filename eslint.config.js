import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    arrowParens: false,
    braceStyle: '1tbs',
    commaDangle: 'never'
  }),
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js', 'scripts/*.mjs', 'test/*.mjs']
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before', '|': 'before', '&': 'before' } }],
      '@stylistic/max-statements-per-line': 'off'
    }
  },
  {
    // The library runs in browsers as well as Node: no Node built-ins.
    files: ['src/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ regex: '^node:', message: 'src/ must run in browsers too.' }] }]
    }
  },
  {
    files: ['scripts/**', 'test/**', 'eslint.config.js'],
    languageOptions: { globals: globals.node }
  },
  {
    // node:test's describe() and it() return promises that the runner awaits.
    files: ['test/**/*.ts'],
    rules: { '@typescript-eslint/no-floating-promises': 'off' }
  },
  {
    // Plain JavaScript has no type information for the type-checked rules.
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked]
  }
);
