import * as Icons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type LucideIcon = React.FC<LucideProps>

function resolveIcon(icon: string): LucideIcon {
  // Try direct lookup first in case it's already PascalCase
  let resolved = (Icons as Record<string, unknown>)[icon]

  if (resolved == null) {
    // Convert kebab-case to PascalCase: "shopping-cart" → "ShoppingCart"
    const pascalCase = icon
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    resolved = (Icons as Record<string, unknown>)[pascalCase]
  }

  return resolved != null ? (resolved as LucideIcon) : Icons.HelpCircle
}

interface TransactionCategoryIconProps {
  icon: string | null
  size?: number
  color?: string
  strokeWidth?: number
}

export function TransactionCategoryIcon({
  icon,
  size = 20,
  color,
  strokeWidth,
}: TransactionCategoryIconProps) {
  const Icon = icon ? resolveIcon(icon) : Icons.HelpCircle
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />
}
