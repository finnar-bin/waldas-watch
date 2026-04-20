import { Alert } from '@mantine/core'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <Alert
      icon={<WifiOff size={16} />}
      color="orange"
      variant="filled"
      radius={0}
      style={{ position: 'sticky', top: 0, zIndex: 1000 }}
    >
      You&apos;re offline. Showing cached data.
    </Alert>
  )
}
