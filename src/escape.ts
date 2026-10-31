const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Escape text for insertion into HTML. globe.gl renders label accessors via
 *  `innerHTML` (float-tooltip), and stop names arrive from untrusted share
 *  links and Nominatim, so every label goes through here. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch])
}
