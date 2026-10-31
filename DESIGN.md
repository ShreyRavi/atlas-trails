# Atlas Trails design system

The one page reviews and new components calibrate against. `src/index.css` is
the implementation; this is the contract.

**Use scene:** someone opens a friend's trip link on their phone, often at
night, and watches it play over a dark globe. Dark UI, one accent, the globe is
the hero, and the interface gets out of the way.

## Color

| Token | Value | Use |
|---|---|---|
| `--bg` | `#060912` | Page and globe background |
| `--fg` | `#e8edf5` | All text |
| `--panel` | `rgba(13, 18, 32, 0.82)` | Glass panels (with `blur(12px)`) |
| `--panel-border` | `rgba(120, 140, 180, 0.22)` | Panel and control borders, progress track |
| `--arc` | `#38e8ff` | The one accent: arcs, pins, primary buttons, focus rings, nights badge, links |
| `--danger` | `#ff8a8a` | Destructive button labels only |

Text on the accent uses `#061018`. Secondary text is `--fg` at reduced opacity,
never a separate gray.

**Contrast** (worst case: `--panel` over a bright city-lights pixel, `#ffd27a`):

| Pair | Ratio |
|---|---|
| `--fg` at 1.0 | 10.4:1 |
| `--fg` at 0.85 (readable text minimum) | 8.0:1 |
| `--fg` at 0.75 (labels minimum) | 6.6:1 |
| `--arc` | 8.3:1 |
| `--danger` | 5.4:1 |
| `#061018` on `--arc` | 12.9:1 |

## Type

Instrument Sans (variable, 400–700), self-hosted through
`@fontsource-variable/instrument-sans`, falling back to `system-ui`. Dates,
stats and counters use `font-variant-numeric: tabular-nums`.

| Role | Size / weight |
|---|---|
| Hero title | 30 / 700 |
| Shared trip title | 24 / 700 |
| Stop card name | 20 / 700 |
| Dialog title | 18 / 700 |
| Card note | 15 / 1.5 line height |
| Buttons, inputs, body | 14–16 / 600 for buttons |
| Stop notes, meta | 13 |
| Labels (dates, counters, codes) | 12, never smaller |

Readable text is at least 13px at 0.85 opacity; labels at least 12px at 0.75.

## Shape and depth

- Radii: 12px controls, 14px panels, 6–8px chips and badges, 999px pills.
- Panels: `--panel`, 1px `--panel-border`, `blur(12px)`, shadow
  `0 8px 30px rgba(0, 0, 0, 0.5)`.
- Dialog backdrop: `rgba(6, 9, 18, 0.6)`.

## Motion

One authored moment: the stop card enters with opacity 0→1 and translateY
8px→0 over 220ms `cubic-bezier(0.2, 0.8, 0.2, 1)`, and leaves with a 150ms
fade. Beyond that only the camera and the arc draw move; the dwell progress line
is a linear fill because it carries information.

Camera flights last ~2.4s for long hops (rising and descending along the great
circle), 1.2s under 300 km, and 300ms between duplicate stops.

Under `prefers-reduced-motion: reduce`, the camera cuts instead of flying, arcs
appear whole, the card fades without moving, and the globe doesn't auto-rotate.

## Icons

Inline SVG from `src/Icon.tsx`: 24px grid, 1.5px stroke, `currentColor`, round
caps, `aria-hidden`. Never emoji as icons.

## Layout and interaction

- Breakpoint: 560px. Below it the stop card is full width and stacks above the
  playback bar, notes clamp to 3 lines, and the stop strip becomes a "2 / 5"
  counter.
- Touch targets: at least 44×44px. Small icon buttons keep their visual size and
  extend the hit area with `::before`.
- Focus: 2px `--arc` outline, 2px offset, on every control.
- Dialogs: native `<dialog>`, Cancel first and focused, destructive action as a
  ghost button with a `--danger` label.
