import { useEffect } from 'react'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { Center, Loader } from '@mantine/core'
import { useSession } from '@/providers/SessionProvider'

export const Route = createFileRoute('/_auth')({
  component: AuthGuard,
})

function AuthGuard() {
  const { session, isLoading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !session) {
      navigate({ to: '/login', replace: true, search: { redirectTo: undefined } })
    }
  }, [session, isLoading, navigate])

  if (isLoading) {
    return (
      <Center h="100dvh">
        <Loader color="teal" />
      </Center>
    )
  }

  if (!session) return null

  return <Outlet />
}
