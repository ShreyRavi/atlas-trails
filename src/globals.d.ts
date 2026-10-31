/** Injected by `define` in vite.config.ts. */
declare const __GIT_SHA__: string
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** Origin share links point at in production, e.g. https://atlas.kansoboard.com */
  readonly VITE_CANONICAL_ORIGIN?: string
}
