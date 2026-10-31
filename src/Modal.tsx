import { useEffect, useRef, type ReactNode } from 'react'

export interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'ghost' | 'danger'
}

interface Props {
  title: string
  children?: ReactNode
  /** The first action receives focus, so put the safe choice (Cancel) first. */
  actions: ModalAction[]
  onClose: () => void
}

/** App-wide dialog on native <dialog>: focus trapping, Esc and the backdrop
 *  come from the platform. Mount it to open, unmount to close. */
export default function Modal({ title, children, actions, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      opener?.focus?.()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault()
        onCloseRef.current()
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (e.target === ref.current) onCloseRef.current()
      }}
    >
      <h2 id="modal-title" className="modal-title">
        {title}
      </h2>
      {children && <div className="modal-body">{children}</div>}
      <div className="modal-actions">
        {actions.map((a, i) => (
          <button
            key={a.label}
            className={`cb-btn ${a.variant === 'primary' ? 'cb-btn-primary' : 'cb-btn-ghost'}${a.variant === 'danger' ? ' is-danger' : ''}`}
            onClick={a.onClick}
            autoFocus={i === 0}
          >
            {a.label}
          </button>
        ))}
      </div>
    </dialog>
  )
}
