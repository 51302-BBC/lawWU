import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// resolve.preserveSymlinks keeps module paths on the drive the command was run
// from. The real project path contains non-ASCII characters, which crash the
// native toolchain binaries on Windows, so local commands run from a `subst`
// drive (see README). Docker builds use /app and are unaffected.
export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: true },
})
