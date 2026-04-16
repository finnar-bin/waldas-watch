import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Center, Loader, Text, Stack } from '@mantine/core'
import { supabase } from '@/lib/supabase-client'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: '/sheets', replace: true })
      } else {
        navigate({ to: '/login', replace: true })
      }
    })
  }, [navigate])

  return (
    <Center h="100dvh">
      <Stack align="center" gap="sm">
        <Loader color="teal" />
        <Text c="dimmed" size="sm">
          Completing sign in…
        </Text>
      </Stack>
    </Center>
  )
}
