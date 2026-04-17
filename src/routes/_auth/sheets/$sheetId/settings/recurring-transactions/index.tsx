import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDisclosure } from '@mantine/hooks'
import {
  ActionIcon,
  Badge,
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
import { useSheetRecurringTransactionsQuery } from '@/queries/use-sheet-recurring-transactions-query'
import { useDeleteRecurringTransactionMutation } from '@/queries/use-delete-recurring-transaction-mutation'
import type { RecurringTransactionItem } from '@/lib/recurring-transactions-requests'

export const Route = createFileRoute(
  '/_auth/sheets/$sheetId/settings/recurring-transactions/',
)({
  component: RecurringTransactionsPage,
})

function RecurringTransactionsPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()
  const navigate = useNavigate()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? '…'

  const { data: recurringList = [] } = useSheetRecurringTransactionsQuery(sheetId)
  const deleteMutation = useDeleteRecurringTransactionMutation(sheetId)

  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [deleting, setDeleting] = useState<RecurringTransactionItem | null>(null)

  function handleOpenDelete(item: RecurringTransactionItem) {
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
                navigate({
                  to: '/sheets/$sheetId/settings/recurring-transactions/new',
                  params: { sheetId },
                })
              }
            >
              Add
            </Button>
          }
        />
        <Box p="md">
          {recurringList.length === 0 ? (
            <Box py="xl" ta="center">
              <Text size="sm" c="dimmed" mb="md">No recurring transactions yet.</Text>
              <Button
                size="sm"
                color="teal"
                leftSection={<Plus size={14} />}
                onClick={() =>
                  navigate({
                    to: '/sheets/$sheetId/settings/recurring-transactions/new',
                    params: { sheetId },
                  })
                }
              >
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
                    <Text size="sm" fw={600} c={item.type === 'income' ? 'teal.7' : 'red.7'}>
                      {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/sheets/$sheetId/settings/recurring-transactions/$recurringId',
                          params: { sheetId, recurringId: item.id },
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
