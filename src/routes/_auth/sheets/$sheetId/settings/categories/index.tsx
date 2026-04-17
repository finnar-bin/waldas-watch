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
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { SheetHeader } from '@/components/SheetHeader'
import { BackLink } from '@/components/BackLink'
import { TransactionCategoryIcon } from '@/components/TransactionCategoryIcon'
import { useSession } from '@/providers/SessionProvider'
import { useUserSheetsQuery } from '@/queries/use-user-sheets-query'
import { useSheetCategoriesQuery } from '@/queries/use-sheet-categories-query'
import { useDeleteCategoryMutation } from '@/queries/use-delete-category-mutation'
import type { CategoryItem } from '@/lib/categories-requests'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings/categories/')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()
  const navigate = useNavigate()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? '…'

  const { data: categories = [] } = useSheetCategoriesQuery(sheetId)
  const deleteMutation = useDeleteCategoryMutation(sheetId)

  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense')
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [deleting, setDeleting] = useState<CategoryItem | null>(null)

  function handleOpenDelete(item: CategoryItem) {
    setDeleting(item)
    openDelete()
  }

  function handleDelete() {
    if (!deleting) return
    deleteMutation.mutate(deleting.id, { onSuccess: closeDelete })
  }

  const filtered = categories.filter((c) => c.type === activeTab)

  return (
    <>
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title={<Text size="lg" fw={700}>Delete category</Text>}
        centered
      >
        <Text size="sm">
          Delete{' '}
          <Text component="span" fw={600}>{deleting?.name}</Text>?
          This will permanently delete the category and all associated data.
        </Text>
        <Group grow mt="lg">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={deleteMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Categories" />
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
                navigate({ to: '/sheets/$sheetId/settings/categories/new', params: { sheetId } })
              }
            >
              Add
            </Button>
          }
        />
        <Box p="md">
          <SegmentedControl
            fullWidth
            mb="md"
            value={activeTab}
            onChange={(v) => setActiveTab(v as 'income' | 'expense')}
            data={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
            color="teal"
          />

          {filtered.length === 0 ? (
            <Box py="xl" ta="center">
              <Text size="sm" c="dimmed" mb="md">
                No {activeTab} categories yet.
              </Text>
              <Button
                size="sm"
                color="teal"
                leftSection={<Plus size={14} />}
                onClick={() =>
                  navigate({ to: '/sheets/$sheetId/settings/categories/new', params: { sheetId } })
                }
              >
                Add one
              </Button>
            </Box>
          ) : (
            <Paper radius="lg" shadow="sm" style={{ overflow: 'hidden' }}>
              {filtered.map((item, index) => (
                <Group
                  key={item.id}
                  px="md"
                  py="sm"
                  justify="space-between"
                  style={{
                    borderBottom:
                      index < filtered.length - 1
                        ? '1px solid var(--mantine-color-gray-1)'
                        : undefined,
                    minHeight: 56,
                  }}
                >
                  <Group gap="sm">
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={item.type === 'income' ? 'teal' : 'red'}
                      variant="light"
                    >
                      <TransactionCategoryIcon icon={item.icon} size={16} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={500}>{item.name}</Text>
                      {item.budget != null && (
                        <Text size="xs" c="dimmed">Budget: {item.budget}</Text>
                      )}
                    </div>
                  </Group>
                  <Group gap={4}>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/sheets/$sheetId/settings/categories/$categoryId',
                          params: { sheetId, categoryId: item.id },
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
