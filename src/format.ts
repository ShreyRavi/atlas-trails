import { utcDay, type Stop } from './types'

/** "Mar 3", "Mar 3 – 6", "Feb 28 – Mar 3", in the visitor's locale.
 *  `formatRange` collapses the shared month on its own; the fallback covers
 *  engines that lack it. */
export function formatDates(stop: Stop): string {
  if (!stop.start) return ''
  const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const start = new Date(utcDay(stop.start))
  if (!stop.end || stop.end === stop.start) return fmt.format(start)
  const end = new Date(utcDay(stop.end))
  try {
    return fmt.formatRange(start, end)
  } catch {
    return `${fmt.format(start)} – ${fmt.format(end)}`
  }
}

let regionNames: Intl.DisplayNames | null | undefined

/** Display name for an ISO country code ("PT" → "Portugal"), falling back to
 *  the code itself. */
export function countryName(code: string): string {
  if (!code) return ''
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(undefined, { type: 'region' })
    } catch {
      regionNames = null
    }
  }
  try {
    return regionNames?.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}
