import { createFileRoute } from '@tanstack/react-router'
import { Box, Text } from '@mantine/core'
import { SheetHeader } from '@/components/SheetHeader'
import { BackLink } from '@/components/BackLink'
import { useSession } from '@/providers/SessionProvider'
import { useUserSheetsQuery } from '@/queries/use-user-sheets-query'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings/payment-types')({
  component: PaymentTypesPage,
})

function PaymentTypesPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? '…'

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Payment Types" />
      <BackLink to="/sheets/$sheetId/settings" params={{ sheetId }} label="Settings" />
      <Box p="md">
        <Text c="dimmed" size="sm">Coming soon.</Text>
      </Box>
    </Box>
  )
}
