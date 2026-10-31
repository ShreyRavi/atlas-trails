import { Component, type ReactNode } from 'react'
import Icon from './Icon'
import { clearTrip } from './storage'
import { clearHash } from './share'
import { VersionTag } from './VersionTag'

interface Props {
  fallback: ReactNode
  children: ReactNode
  onError?: (error: unknown) => void
}
interface State {
  failed: boolean
}

/** Catches render-time crashes and shows a fallback instead of a blank white
 *  screen. Used twice: around the whole app (CrashScreen) and around the lazy
 *  globe (GlobeFallback), so a globe failure leaves the command bar usable. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Whole-app crash. "Start fresh" clears only the share link and the
 *  autosaved working trip (in case either is what crashes the app), then
 *  reloads so nothing in memory can save the bad state back. Saved trips in
 *  the library are never touched. */
export function CrashScreen() {
  function startFresh() {
    clearHash()
    clearTrip()
    location.reload()
  }
  return (
    <div className="crash">
      <div className="unsupported-icon">
        <Icon name="globe" size={44} />
      </div>
      <h1>Something went wrong</h1>
      <p>The app hit an unexpected error.</p>
      <div className="crash-actions">
        <button className="cb-btn cb-btn-primary" onClick={() => location.reload()}>
          Reload
        </button>
        <button className="cb-btn cb-btn-ghost" onClick={startFresh}>
          Start fresh
        </button>
      </div>
      <p className="crash-hint">Start fresh clears the current trip. Your saved trips are kept.</p>
      <VersionTag inline />
    </div>
  )
}

/** The globe failed to load or render, most often a stale chunk after a new
 *  deploy. The command bar stays usable; Reload fetches the current build. */
export function GlobeFallback() {
  return (
    <div className="globe-fallback">
      <p>The globe couldn't load.</p>
      <button className="cb-btn cb-btn-primary" onClick={() => location.reload()}>
        Reload
      </button>
    </div>
  )
}
