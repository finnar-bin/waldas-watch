import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

interface BackLinkProps {
  to: string
  params?: Record<string, string>
  label: string
}

export function BackLink({ to, params, label }: BackLinkProps) {
  return (
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
        paddingInline: 'var(--mantine-spacing-md)',
      }}
    >
      <ChevronLeft size={14} />
      {label}
    </Link>
  )
}
