import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

// Phase 0: scripts + tests only. UI-specific linting added Phase 4+.
export default tseslint.config(
  {
    ignores: ['assets/**', 'dist/**', 'node_modules/**', 'public/**'],
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
)
