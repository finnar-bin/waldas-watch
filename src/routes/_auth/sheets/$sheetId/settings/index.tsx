import { createFileRoute, Link } from '@tanstack/react-router'
import { Box, Group, Paper, Stack, Text } from '@mantine/core'
import { ChevronRight, CreditCard, Repeat, Settings, Tag, Users } from 'lucide-react'
import { SheetHeader } from '@/components/SheetHeader'
import { useSession } from '@/providers/SessionProvider'
import { useUserSheetsQuery } from '@/queries/use-user-sheets-query'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings/')({
  component: SettingsPage,
})

const NAV_ITEMS = [
  { label: 'General Settings', icon: Settings, to: '/sheets/$sheetId/settings/general' },
  { label: 'Categories', icon: Tag, to: '/sheets/$sheetId/settings/categories' },
  { label: 'Recurring Transactions', icon: Repeat, to: '/sheets/$sheetId/settings/recurring-transactions' },
  { label: 'Payment Types', icon: CreditCard, to: '/sheets/$sheetId/settings/payment-types' },
  { label: 'Manage Users', icon: Users, to: '/sheets/$sheetId/settings/manage-users' },
] as const

function SettingsPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? '…'

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Settings" />
      <Stack gap="md" p="md">
        <Paper radius="lg" shadow="sm" style={{ overflow: 'hidden' }}>
          {NAV_ITEMS.map(({ label, icon: Icon, to }, index) => (
            <Link
              key={to}
              to={to}
              params={{ sheetId }}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <Group
                px="md"
                py="sm"
                justify="space-between"
                style={{
                  borderBottom:
                    index < NAV_ITEMS.length - 1
                      ? '1px solid var(--mantine-color-gray-1)'
                      : undefined,
                  minHeight: 52,
                }}
              >
                <Group gap="sm">
                  <Icon size={18} color="var(--mantine-color-teal-7)" strokeWidth={1.75} />
                  <Text size="sm" fw={500}>
                    {label}
                  </Text>
                </Group>
                <ChevronRight size={16} color="var(--mantine-color-gray-5)" />
              </Group>
            </Link>
          ))}
        </Paper>

        <Stack gap={6} align="center">
          <Group gap={8} align="center">
            <Text size="xs" c="dimmed">v{__APP_VERSION__}</Text>
            <Box style={{ width: 1, height: 12, background: 'var(--mantine-color-gray-3)' }} />
            <Text
              component="a"
              href={`https://github.com/finnar-bin/waldas-watch/commit/${__GIT_HASH__}`}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="teal.6"
              style={{ fontFamily: 'monospace', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {__GIT_HASH__}
            </Text>
          </Group>
          <Text
            component="a"
            href="https://github.com/finnar-bin/waldas-watch/issues"
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="teal.6"
            style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            🐛 Something broken? Tell us!
          </Text>
        </Stack>
      </Stack>
    </Box>
  )
}
