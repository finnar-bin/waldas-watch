import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from '@mantine/core'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { SheetHeader } from '@/components/SheetHeader'
import { BackLink } from '@/components/BackLink'
import { IconCombobox } from '@/components/IconCombobox'
import { TransactionCategoryIcon } from '@/components/TransactionCategoryIcon'
import { useSession } from '@/providers/SessionProvider'
import { useUserSheetsQuery } from '@/queries/use-user-sheets-query'
import { useSheetRecurringTransactionsQuery } from '@/queries/use-sheet-recurring-transactions-query'
import { useCreateRecurringTransactionMutation } from '@/queries/use-create-recurring-transaction-mutation'
import { useUpdateRecurringTransactionMutation } from '@/queries/use-update-recurring-transaction-mutation'
import { useDeleteRecurringTransactionMutation } from '@/queries/use-delete-recurring-transaction-mutation'
import { useSheetTransactionCategoriesQuery } from '@/queries/use-sheet-transaction-categories-query'
import { useSheetPaymentTypesQuery } from '@/queries/use-sheet-payment-types-query'
import type { RecurringFrequency, RecurringTransactionItem } from '@/lib/recurring-transactions-requests'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings/recurring-transactions')({
  component: RecurringTransactionsPage,
})

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
]

interface FormValues {
  type: 'income' | 'expense'
  categoryId: string
  paymentTypeId: string
  amount: number | ''
  frequency: RecurringFrequency
  dayOfMonth: number | ''
  description: string
}

function RecurringTransactionsPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? '…'

  const { data: recurringList = [] } = useSheetRecurringTransactionsQuery(sheetId)

  const createMutation = useCreateRecurringTransactionMutation(sheetId)
  const updateMutation = useUpdateRecurringTransactionMutation(sheetId)
  const deleteMutation = useDeleteRecurringTransactionMutation(sheetId)

  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false)
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [editing, setEditing] = useState<RecurringTransactionItem | null>(null)
  const [deleting, setDeleting] = useState<RecurringTransactionItem | null>(null)

  const form = useForm<FormValues>({
    initialValues: {
      type: 'expense',
      categoryId: '',
      paymentTypeId: '',
      amount: '',
      frequency: 'monthly',
      dayOfMonth: '',
      description: '',
    },
    validate: {
      categoryId: (v) => (v.length === 0 ? 'Category is required' : null),
      amount: (v) => (v === '' || Number(v) <= 0 ? 'Enter a valid amount' : null),
    },
  })

  const selectedType = form.values.type
  const { data: categories = [] } = useSheetTransactionCategoriesQuery(sheetId, selectedType)
  const { data: paymentTypes = [] } = useSheetPaymentTypesQuery(sheetId)

  const categoryItems = categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))
  const paymentTypeItems = paymentTypes.map((p) => ({ id: p.id, name: p.name, icon: p.icon }))

  function handleOpenAdd() {
    setEditing(null)
    form.reset()
    openForm()
  }

  function handleOpenEdit(item: RecurringTransactionItem) {
    setEditing(item)
    form.setValues({
      type: item.type,
      categoryId: item.categoryId,
      paymentTypeId: item.paymentTypeId ?? '',
      amount: item.amount,
      frequency: item.frequency,
      dayOfMonth: item.dayOfMonth ?? '',
      description: item.description ?? '',
    })
    form.resetDirty()
    openForm()
  }

  function handleOpenDelete(item: RecurringTransactionItem) {
    setDeleting(item)
    openDelete()
  }

  function handleTypeChange(type: 'income' | 'expense') {
    form.setFieldValue('type', type)
    if (!editing) {
      form.setFieldValue('categoryId', '')
    }
  }

  function handleSubmit(values: FormValues) {
    const payload = {
      type: values.type,
      categoryId: values.categoryId,
      paymentTypeId: values.type === 'expense' && values.paymentTypeId ? values.paymentTypeId : null,
      amount: Number(values.amount),
      description: values.description.trim() || null,
      frequency: values.frequency,
      dayOfMonth: values.frequency === 'monthly' && values.dayOfMonth !== '' ? Number(values.dayOfMonth) : null,
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, input: payload }, { onSuccess: closeForm })
    } else {
      createMutation.mutate(
        { ...payload, sheetId, createdBy: session!.user.id },
        { onSuccess: closeForm },
      )
    }
  }

  function handleDelete() {
    if (!deleting) return
    deleteMutation.mutate(deleting.id, { onSuccess: closeDelete })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={
          <Text size="lg" fw={700}>
            {editing ? 'Edit recurring' : 'Add recurring'}
          </Text>
        }
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Type"
              data={TYPE_OPTIONS}
              allowDeselect={false}
              withAsterisk
              value={form.values.type}
              onChange={(v) => handleTypeChange(v as 'income' | 'expense')}
              error={form.errors.type}
            />
            <IconCombobox
              label="Category"
              placeholder="Select a category"
              items={categoryItems}
              value={form.values.categoryId || null}
              onChange={(v) => form.setFieldValue('categoryId', v ?? '')}
              error={form.errors.categoryId}
            />
            {form.values.type === 'expense' && (
              <IconCombobox
                label="Payment type"
                placeholder="Select (optional)"
                items={paymentTypeItems}
                value={form.values.paymentTypeId || null}
                onChange={(v) => form.setFieldValue('paymentTypeId', v ?? '')}
              />
            )}
            <NumberInput
              label="Amount"
              placeholder="0.00"
              min={0.01}
              decimalScale={2}
              withAsterisk
              {...form.getInputProps('amount')}
            />
            <Select
              label="Frequency"
              data={FREQUENCY_OPTIONS}
              allowDeselect={false}
              withAsterisk
              {...form.getInputProps('frequency')}
            />
            {form.values.frequency === 'monthly' && (
              <NumberInput
                label="Day of month"
                placeholder="e.g. 1, 15, 28"
                min={1}
                max={31}
                {...form.getInputProps('dayOfMonth')}
              />
            )}
            <Textarea
              label="Description"
              placeholder="e.g. Monthly rent"
              rows={2}
              {...form.getInputProps('description')}
            />
            <Group grow mt="xs">
              <Button variant="default" onClick={closeForm}>Cancel</Button>
              <Button type="submit" color="teal" loading={isPending}>
                {editing ? 'Save' : 'Add'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title={<Text size="lg" fw={700}>Delete recurring</Text>}
        centered
      >
        <Text size="sm">
          Remove this recurring transaction? Past transactions will not be affected.
        </Text>
        <Group grow mt="lg">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={deleteMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Recurring" />
        <BackLink to="/sheets/$sheetId/settings" params={{ sheetId }} label="Settings" />
        <Box p="md">
          <Group justify="flex-end" mb="md">
            <Button
              size="xs"
              color="teal"
              leftSection={<Plus size={14} />}
              onClick={handleOpenAdd}
            >
              Add
            </Button>
          </Group>

          {recurringList.length === 0 ? (
            <Box py="xl" ta="center">
              <Text size="sm" c="dimmed" mb="md">No recurring transactions yet.</Text>
              <Button size="sm" color="teal" leftSection={<Plus size={14} />} onClick={handleOpenAdd}>
                Add one
              </Button>
            </Box>
          ) : (
            <Paper radius="lg" shadow="sm" style={{ overflow: 'hidden' }}>
              {recurringList.map((item, index) => (
                <Group
                  key={item.id}
                  px="md"
                  py="sm"
                  justify="space-between"
                  style={{
                    borderBottom:
                      index < recurringList.length - 1
                        ? '1px solid var(--mantine-color-gray-1)'
                        : undefined,
                    minHeight: 60,
                  }}
                >
                  <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={item.type === 'income' ? 'teal' : 'red'}
                      variant="light"
                      style={{ flexShrink: 0 }}
                    >
                      <TransactionCategoryIcon icon={item.categoryIcon} size={16} />
                    </ThemeIcon>
                    <div style={{ minWidth: 0 }}>
                      <Group gap={6} align="center">
                        <Text size="sm" fw={500} truncate>
                          {item.description || item.categoryName}
                        </Text>
                        {!item.isActive && (
                          <Badge size="xs" color="gray" variant="light">Paused</Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {item.frequency}
                        {item.dayOfMonth != null ? ` · day ${item.dayOfMonth}` : ''}
                        {item.paymentTypeName ? ` · ${item.paymentTypeName}` : ''}
                      </Text>
                    </div>
                  </Group>
                  <Group gap={8} style={{ flexShrink: 0 }}>
                    <Text
                      size="sm"
                      fw={600}
                      c={item.type === 'income' ? 'teal.7' : 'red.7'}
                    >
                      {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleOpenDelete(item)}
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Paper>
          )}
        </Box>
      </Box>
    </>
  )
}
