import { useState } from 'react'
import { Avatar, Combobox, Group, InputBase, InputLabel, Stack, Text, useCombobox } from '@mantine/core'
import { useSheetMembersQuery } from '@/queries/use-sheet-members-query'
import { getInitials } from '@/lib/get-initials'

interface CreatorComboboxProps {
  sheetId: string
  label?: string
  placeholder?: string
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

export function CreatorCombobox({
  sheetId,
  label,
  placeholder = 'All creators',
  value,
  onChange,
  disabled = false,
}: CreatorComboboxProps) {
  const [search, setSearch] = useState('')
  const { data: members = [] } = useSheetMembersQuery(sheetId)

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      setSearch('')
    },
    onDropdownOpen: () => combobox.selectFirstOption(),
  })

  const selected = members.find((m) => m.userId === value) ?? null
  const selectedLabel = selected?.displayName ?? selected?.email ?? null

  const filtered = members.filter((m) => {
    const name = m.displayName ?? m.email ?? ''
    return name.toLowerCase().includes(search.toLowerCase().trim())
  })

  const options = filtered.map((m) => {
    const label = m.displayName ?? m.email ?? m.userId
    const initials = getInitials(m.displayName, m.email)
    return (
      <Combobox.Option value={m.userId} key={m.userId} active={m.userId === value}>
        <Group gap="sm">
          <Avatar src={m.avatarUrl ?? undefined} size={20} radius="xl" color="teal">
            {initials}
          </Avatar>
          <Text size="sm">{label}</Text>
        </Group>
      </Combobox.Option>
    )
  })

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
              selected && !combobox.dropdownOpened ? (
                <Avatar
                  src={selected.avatarUrl ?? undefined}
                  size={16}
                  radius="xl"
                  color="teal"
                >
                  {getInitials(selected.displayName, selected.email)}
                </Avatar>
              ) : null
            }
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            value={search || (combobox.dropdownOpened ? '' : (selectedLabel ?? ''))}
            onChange={(e) => {
              if (disabled) return
              setSearch(e.currentTarget.value)
              combobox.openDropdown()
              combobox.updateSelectedOptionIndex()
            }}
            onClick={() => { if (!disabled) combobox.openDropdown() }}
            onFocus={() => { if (!disabled) combobox.openDropdown() }}
            onBlur={() => combobox.closeDropdown()}
            placeholder={placeholder}
            disabled={disabled}
          />
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            {options.length > 0 ? options : <Combobox.Empty>Nothing found</Combobox.Empty>}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Stack>
  )
}
