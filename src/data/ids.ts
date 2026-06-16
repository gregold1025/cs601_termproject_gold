// Shared ID generator for user-authored artifacts (moves, shapes,
// stickers, future artifact types). The format is `${prefix}-${ts}-${rand}`
// with the timestamp providing rough time-order and the random suffix
// giving ~1/1000 collision odds per millisecond inside a single prefix.
//
// Future hardening seam: swap to crypto.randomUUID() in one place.

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
