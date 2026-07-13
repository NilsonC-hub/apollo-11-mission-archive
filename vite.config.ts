import { defineConfig } from 'vite'

// Vite config skeleton.
// Phase 0: no UI entry yet. Plugin/react loaded Phase 4+ when UI ships.
// Vite itself is needed by scripts that walk dist (none in Phase 0); keep installed via later phase.

export default defineConfig({
  plugins: [],
  build: {
    chunkSizeWarningLimit: 900,
  },
})
