/** Shared slug rule for heading ids and outline links (docs and articles). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}
