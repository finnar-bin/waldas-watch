export function getInitials(name: string | null, email: string | null): string {
  const source = name || email || '?'
  return source
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
