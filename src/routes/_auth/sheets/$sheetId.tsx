import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@mantine/core'
import { BottomNav } from '@/components/BottomNav'

export const Route = createFileRoute('/_auth/sheets/$sheetId')({
  component: SheetLayout,
})

function SheetLayout() {
  const { sheetId } = Route.useParams()

  return (
    <AppShell footer={{ height: 64 }} padding={0}>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
      <AppShell.Footer>
        <BottomNav sheetId={sheetId} />
      </AppShell.Footer>
    </AppShell>
  )
}
