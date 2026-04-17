import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { SheetHeader } from '@/components/SheetHeader'
import { BackLink } from '@/components/BackLink'
import { IconPickerGrid } from '@/components/IconPickerGrid'
import { TransactionCategoryIcon } from '@/components/TransactionCategoryIcon'
import { useSession } from '@/providers/SessionProvider'
import { useUserSheetsQuery } from '@/queries/use-user-sheets-query'
import { useSheetPaymentTypesQuery } from '@/queries/use-sheet-payment-types-query'
import { useCreatePaymentTypeMutation } from '@/queries/use-create-payment-type-mutation'
import { useUpdatePaymentTypeMutation } from '@/queries/use-update-payment-type-mutation'
import { useDeletePaymentTypeMutation } from '@/queries/use-delete-payment-type-mutation'
import { PAYMENT_TYPE_ICONS } from '@/lib/constants/icons'
import type { PaymentTypeOption } from '@/lib/transaction-form-requests'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings/payment-types')({
  component: PaymentTypesPage,
})

interface FormValues {
  name: string
  icon: string
}

function PaymentTypesPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? '…'

  const { data: paymentTypes = [] } = useSheetPaymentTypesQuery(sheetId)

  const createMutation = useCreatePaymentTypeMutation(sheetId)
  const updateMutation = useUpdatePaymentTypeMutation(sheetId)
  const deleteMutation = useDeletePaymentTypeMutation(sheetId)

  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false)
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [editing, setEditing] = useState<PaymentTypeOption | null>(null)
  const [deleting, setDeleting] = useState<PaymentTypeOption | null>(null)

  const form = useForm<FormValues>({
    initialValues: { name: '', icon: PAYMENT_TYPE_ICONS[0] },
    validate: {
      name: (v) => (v.trim().length === 0 ? 'Name is required' : null),
      icon: (v) => (v.length === 0 ? 'Pick an icon' : null),
    },
  })

  function handleOpenAdd() {
    setEditing(null)
    form.reset()
    openForm()
  }

  function handleOpenEdit(item: PaymentTypeOption) {
    setEditing(item)
    form.setValues({ name: item.name, icon: item.icon })
    form.resetDirty({ name: item.name, icon: item.icon })
    openForm()
  }

  function handleOpenDelete(item: PaymentTypeOption) {
    setDeleting(item)
    openDelete()
  }

  function handleSubmit(values: FormValues) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, input: { name: values.name.trim(), icon: values.icon } },
        { onSuccess: closeForm },
      )
    } else {
      createMutation.mutate(
        {
          sheetId,
          createdBy: session!.user.id,
          name: values.name.trim(),
          icon: values.icon,
        },
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
        title={<Text size="lg" fw={700}>{editing ? 'Edit payment type' : 'Add payment type'}</Text>}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Name"
              placeholder="e.g. Debit Card, Cash"
              withAsterisk
              {...form.getInputProps('name')}
            />
            <IconPickerGrid
              label="Icon"
              icons={PAYMENT_TYPE_ICONS}
              value={form.values.icon}
              onChange={(icon) => form.setFieldValue('icon', icon)}
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
        title={<Text size="lg" fw={700}>Delete payment type</Text>}
        centered
      >
        <Text size="sm">
          Delete{' '}
          <Text component="span" fw={600}>{deleting?.name}</Text>?
          Existing transactions using this payment type will keep their data.
        </Text>
        <Group grow mt="lg">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={deleteMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Payment Types" />
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

          {paymentTypes.length === 0 ? (
            <Box py="xl" ta="center">
              <Text size="sm" c="dimmed" mb="md">No payment types yet.</Text>
              <Button size="sm" color="teal" leftSection={<Plus size={14} />} onClick={handleOpenAdd}>
                Add one
              </Button>
            </Box>
          ) : (
            <Paper radius="lg" shadow="sm" style={{ overflow: 'hidden' }}>
              {paymentTypes.map((item, index) => (
                <Group
                  key={item.id}
                  px="md"
                  py="sm"
                  justify="space-between"
                  style={{
                    borderBottom:
                      index < paymentTypes.length - 1
                        ? '1px solid var(--mantine-color-gray-1)'
                        : undefined,
                    minHeight: 56,
                  }}
                >
                  <Group gap="sm">
                    <ThemeIcon size="md" radius="xl" color="teal" variant="light">
                      <TransactionCategoryIcon icon={item.icon} size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>{item.name}</Text>
                  </Group>
                  <Group gap={4}>
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
