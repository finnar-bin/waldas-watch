import { createRootRoute, Outlet } from '@tanstack/react-router'
import { OfflineBanner } from '@/components/OfflineBanner'
import { SyncBanner } from '@/components/SyncBanner'
import { InstallBanner } from '@/components/InstallBanner'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <OfflineBanner />
      <SyncBanner />
      <InstallBanner />
      <Outlet />
    </>
  )
}
