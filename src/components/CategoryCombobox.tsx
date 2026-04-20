import { IconCombobox } from '@/components/IconCombobox'
import { useSheetCategoriesQuery } from '@/queries/use-sheet-categories-query'
import type { CategoryItem } from '@/lib/categories-requests'

interface CategoryComboboxProps {
  sheetId: string
  type?: 'income' | 'expense'
  label?: string
  value: string | null
  onChange: (value: string | null, item: CategoryItem | null) => void
  error?: React.ReactNode
  disabled?: boolean
}

export function CategoryCombobox({
  sheetId,
  type,
  label,
  value,
  onChange,
  error,
  disabled,
}: CategoryComboboxProps) {
  const { data: categories = [] } = useSheetCategoriesQuery(sheetId)
  const items = type ? categories.filter((c) => c.type === type) : categories

  return (
    <IconCombobox
      label={label}
      placeholder="Select a category"
      items={items}
      value={value}
      onChange={(val) => {
        const item = categories.find((c) => c.id === val) ?? null
        onChange(val, item)
      }}
      error={error}
      disabled={disabled}
    />
  )
}
