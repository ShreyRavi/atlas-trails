import { Component, type ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}
interface State {
  failed: boolean
}

/** Catches render-time crashes (e.g. WebGL context failure inside the globe)
 *  and shows a fallback instead of a blank white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
