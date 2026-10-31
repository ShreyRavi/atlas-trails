/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/** Commit shown in the version tag: an explicit GIT_SHA wins, then the commit
 *  Vercel's git integration is building, else "dev". */
const sha = (process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_SHA__: JSON.stringify(sha),
    __APP_VERSION__: JSON.stringify(version),
  },
  test: {
    // Unit tests only; e2e/ belongs to Playwright (npm run test:e2e).
    include: ['src/**/*.test.ts'],
  },
})
