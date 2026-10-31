const REPO = 'https://github.com/ShreyRavi/atlas-trails'

/** "v1.2.0 · abc1234", linking to the deployed commit. Local builds show
 *  "dev" with no link. */
export function VersionTag({ inline = false }: { inline?: boolean }) {
  const sha = __GIT_SHA__
  const label = `v${__APP_VERSION__} · ${sha}`
  const className = inline ? 'version-tag is-inline' : 'version-tag'
  if (sha === 'dev') return <span className={className}>{label}</span>
  return (
    <a className={className} href={`${REPO}/commit/${sha}`} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  )
}
