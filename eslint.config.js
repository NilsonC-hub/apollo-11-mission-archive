import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

// Phase-aware linting: Node globals for source tooling, browser globals for the Phase 4 UI.
export default tseslint.config(
  {
    ignores: ['.tools/**', 'assets/**', 'dist/**', 'node_modules/**', 'public/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['scripts/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['src/**/*.tsx'],
    languageOptions: { globals: { ...globals.browser } },
  },
)
