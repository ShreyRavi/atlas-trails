/** Shown when WebGL is unavailable, so the user sees guidance instead of a
 *  blank globe. */
export default function Unsupported() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 44 }}>🌍</div>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Atlas Trails needs WebGL</h1>
      <p style={{ margin: 0, maxWidth: 420, opacity: 0.7, lineHeight: 1.5 }}>
        The globe is rendered with WebGL, which your browser couldn't start. Try a
        recent version of Chrome, Safari, Firefox, or Edge with hardware
        acceleration enabled.
      </p>
    </div>
  )
}
