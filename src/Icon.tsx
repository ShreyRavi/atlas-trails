/** Inline SVG icons: 1.5px stroke, `currentColor`, decorative by default.
 *  Replaces emoji-as-icons so glyphs render the same on every platform. */
const PATHS = {
  play: 'M7 5l12 7-12 7V5z',
  pause: 'M8 5v14M16 5v14',
  prev: 'M18 6l-8 6 8 6V6zM6 6v12',
  next: 'M6 6l8 6-8 6V6zM18 6v12',
  close: 'M6 6l12 12M18 6L6 18',
  replay: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  star: 'M12 4l2.5 5.1 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8L12 4z',
  check: 'M5 12.5l4.5 4.5L19 7',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  list: 'M5 7h14M5 12h14M5 17h14',
  external: 'M14 5h5v5M19 5l-8 8M17 14v5H5V7h5',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
} as const

export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
