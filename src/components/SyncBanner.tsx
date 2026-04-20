import { Alert, Button, Group, Loader, Text } from '@mantine/core'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useOfflineQueueReplay } from '@/hooks/use-offline-queue-replay'

export function SyncBanner() {
  const { isSyncing, queuedCount, failedCount, retryFailed } = useOfflineQueueReplay()

  if (isSyncing) {
    return (
      <Alert
        icon={<Loader size={16} color="blue" />}
        color="blue"
        variant="filled"
        radius={0}
        style={{ position: 'sticky', top: 0, zIndex: 999 }}
      >
        Syncing pending changes…
      </Alert>
    )
  }

  if (failedCount > 0) {
    return (
      <Alert
        icon={<AlertCircle size={16} />}
        color="red"
        variant="filled"
        radius={0}
        style={{ position: 'sticky', top: 0, zIndex: 999 }}
      >
        <Group justify="space-between" align="center">
          <Text size="sm">
            {failedCount} {failedCount === 1 ? 'change' : 'changes'} failed to sync.
          </Text>
          <Button size="xs" color="red" variant="light" onClick={retryFailed} leftSection={<RefreshCw size={12} />}>
            Retry
          </Button>
        </Group>
      </Alert>
    )
  }

  if (queuedCount > 0) {
    return (
      <Alert
        icon={<RefreshCw size={16} />}
        color="yellow"
        variant="filled"
        radius={0}
        style={{ position: 'sticky', top: 0, zIndex: 999 }}
      >
        {queuedCount} {queuedCount === 1 ? 'change' : 'changes'} will sync when you reconnect.
      </Alert>
    )
  }

  return null
}
