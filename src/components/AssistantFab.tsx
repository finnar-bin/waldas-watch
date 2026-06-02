import { ActionIcon, Box, Tooltip } from '@mantine/core'
import { Sparkles } from 'lucide-react'

interface AssistantFabProps {
  onClick: () => void
}

export function AssistantFab({ onClick }: AssistantFabProps) {
  return (
    <Box
      style={{
        position: 'fixed',
        right: 16,
        bottom: 76,
        zIndex: 240,
      }}
    >
      <Tooltip label="Ask Walda AI" withArrow position="top">
        <ActionIcon
          size={56}
          radius="xl"
          onClick={onClick}
          aria-label="Open financial assistant"
          style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
            color: 'white',
            boxShadow: '0 10px 22px rgba(15, 118, 110, 0.38)',
          }}
        >
          <Sparkles size={26} />
        </ActionIcon>
      </Tooltip>
    </Box>
  )
}
