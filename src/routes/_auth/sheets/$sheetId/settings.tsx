import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings')({
  component: () => <Outlet />,
})
