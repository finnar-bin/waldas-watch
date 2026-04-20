import { IconCombobox } from '@/components/IconCombobox'
import { useSheetPaymentTypesQuery } from '@/queries/use-sheet-payment-types-query'

interface PaymentTypeComboboxProps {
  sheetId: string
  label?: string
  placeholder?: string
  value: string | null
  onChange: (value: string | null) => void
  error?: React.ReactNode
  disabled?: boolean
}

export function PaymentTypeCombobox({
  sheetId,
  label,
  placeholder = 'Select a payment type',
  value,
  onChange,
  error,
  disabled,
}: PaymentTypeComboboxProps) {
  const { data: paymentTypes = [] } = useSheetPaymentTypesQuery(sheetId)

  return (
    <IconCombobox
      label={label}
      placeholder={placeholder}
      items={paymentTypes}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
    />
  )
}
