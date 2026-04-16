import { createRootRoute, Outlet } from '@tanstack/react-router'
import { OfflineBanner } from '@/components/OfflineBanner'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <OfflineBanner />
      <Outlet />
    </>
  )
}
