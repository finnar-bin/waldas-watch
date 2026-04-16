import { useState } from 'react'
import {
  Combobox,
  Group,
  Input,
  InputBase,
  InputError,
  InputLabel,
  Stack,
  Text,
  useCombobox,
} from '@mantine/core'
import { TransactionCategoryIcon } from '@/components/TransactionCategoryIcon'

export interface IconComboboxItem {
  id: string
  name: string
  icon: string
}

interface IconComboboxProps {
  label?: string
  placeholder?: string
  items: IconComboboxItem[]
  value: string | null
  onChange: (value: string | null) => void
  error?: React.ReactNode
}

export function IconCombobox({
  label,
  placeholder = 'Select an option',
  items,
  value,
  onChange,
  error,
}: IconComboboxProps) {
  const [search, setSearch] = useState('')

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      setSearch('')
    },
    onDropdownOpen: () => combobox.selectFirstOption(),
  })

  const selected = items.find((c) => c.id === value) ?? null

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim()),
  )

  const options = filtered.map((item) => (
    <Combobox.Option value={item.id} key={item.id} active={item.id === value}>
      <Group gap="sm">
        <TransactionCategoryIcon icon={item.icon} size={16} />
        <Text size="sm">{item.name}</Text>
      </Group>
    </Combobox.Option>
  ))

  return (
    <Stack gap={4}>
      {label && <InputLabel>{label}</InputLabel>}
      <Combobox
        store={combobox}
        onOptionSubmit={(val) => {
          onChange(val)
          combobox.closeDropdown()
        }}
      >
        <Combobox.Target>
          <InputBase
            leftSection={
              selected && !combobox.dropdownOpened
                ? <TransactionCategoryIcon icon={selected.icon} size={16} color="black" />
                : null
            }
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            value={search || (combobox.dropdownOpened ? '' : (selected?.name ?? ''))}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              combobox.openDropdown()
              combobox.updateSelectedOptionIndex()
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => combobox.closeDropdown()}
            placeholder={placeholder}
            error={!!error}
          />
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            {options.length > 0 ? options : <Combobox.Empty>Nothing found</Combobox.Empty>}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      {error && <InputError>{error}</InputError>}
    </Stack>
  )
}
