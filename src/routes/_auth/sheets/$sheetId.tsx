import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { BottomNav } from '@/components/BottomNav'
import { FinancialAssistantDrawer } from '@/components/FinancialAssistantDrawer'

export const Route = createFileRoute('/_auth/sheets/$sheetId')({
  component: SheetLayout,
})

function SheetLayout() {
  const { sheetId } = Route.useParams()
  const [assistantOpened, { open: openAssistant, close: closeAssistant }] =
    useDisclosure(false)

  return (
    <AppShell footer={{ height: 64 }} padding={0}>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
      <FinancialAssistantDrawer
        opened={assistantOpened}
        onClose={closeAssistant}
        sheetId={sheetId}
      />
      <AppShell.Footer>
        <BottomNav
          sheetId={sheetId}
          onOpenAssistant={openAssistant}
          assistantOpened={assistantOpened}
        />
      </AppShell.Footer>
    </AppShell>
  )
}
