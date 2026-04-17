import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

interface BackLinkProps {
  to: string
  params?: Record<string, string>
  label: string
  rightSection?: React.ReactNode
}

export function BackLink({ to, params, label, rightSection }: BackLinkProps) {
  const link = (
    <Link
      to={to}
      params={params}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        textDecoration: 'none',
        color: 'var(--mantine-color-teal-6)',
        fontWeight: 500,
        fontSize: 'var(--mantine-font-size-sm)',
      }}
    >
      <ChevronLeft size={14} />
      {label}
    </Link>
  )

  if (!rightSection) {
    return (
      <div style={{ paddingInline: 'var(--mantine-spacing-md)' }}>{link}</div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 'var(--mantine-spacing-md)',
      }}
    >
      {link}
      {rightSection}
    </div>
  )
}
