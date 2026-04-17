import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDisclosure } from '@mantine/hooks'
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { SheetHeader } from '@/components/SheetHeader'
import { BackLink } from '@/components/BackLink'
import { TransactionCategoryIcon } from '@/components/TransactionCategoryIcon'
import { useSession } from '@/providers/SessionProvider'
import { useUserSheetsQuery } from '@/queries/use-user-sheets-query'
import { useSheetPaymentTypesQuery } from '@/queries/use-sheet-payment-types-query'
import { useDeletePaymentTypeMutation } from '@/queries/use-delete-payment-type-mutation'
import type { PaymentTypeOption } from '@/lib/transaction-form-requests'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings/payment-types/')({
  component: PaymentTypesPage,
})

function PaymentTypesPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()
  const navigate = useNavigate()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? '…'

  const { data: paymentTypes = [] } = useSheetPaymentTypesQuery(sheetId)
  const deleteMutation = useDeletePaymentTypeMutation(sheetId)

  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [deleting, setDeleting] = useState<PaymentTypeOption | null>(null)

  function handleOpenDelete(item: PaymentTypeOption) {
    setDeleting(item)
    openDelete()
  }

  function handleDelete() {
    if (!deleting) return
    deleteMutation.mutate(deleting.id, { onSuccess: closeDelete })
  }

  return (
    <>
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
        <BackLink
          to="/sheets/$sheetId/settings"
          params={{ sheetId }}
          label="Settings"
          rightSection={
            <Button
              size="xs"
              color="teal"
              leftSection={<Plus size={14} />}
              onClick={() =>
                navigate({ to: '/sheets/$sheetId/settings/payment-types/new', params: { sheetId } })
              }
            >
              Add
            </Button>
          }
        />
        <Box p="md">
          {paymentTypes.length === 0 ? (
            <Box py="xl" ta="center">
              <Text size="sm" c="dimmed" mb="md">No payment types yet.</Text>
              <Button
                size="sm"
                color="teal"
                leftSection={<Plus size={14} />}
                onClick={() =>
                  navigate({ to: '/sheets/$sheetId/settings/payment-types/new', params: { sheetId } })
                }
              >
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
                      onClick={() =>
                        navigate({
                          to: '/sheets/$sheetId/settings/payment-types/$paymentTypeId',
                          params: { sheetId, paymentTypeId: item.id },
                        })
                      }
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
