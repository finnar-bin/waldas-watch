export function formatDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00')
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long' }).format(
    date,
  )
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
