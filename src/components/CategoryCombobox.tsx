import { IconCombobox } from '@/components/IconCombobox'
import type { TransactionCategoryOption } from '@/lib/transaction-form-requests'

interface CategoryComboboxProps {
  label?: string
  categories: TransactionCategoryOption[]
  value: string | null
  onChange: (value: string | null) => void
  error?: React.ReactNode
}

export function CategoryCombobox({
  label,
  categories,
  value,
  onChange,
  error,
}: CategoryComboboxProps) {
  return (
    <IconCombobox
      label={label}
      placeholder="Select a category"
      items={categories}
      value={value}
      onChange={onChange}
      error={error}
    />
  )
}
