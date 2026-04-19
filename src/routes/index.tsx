import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Center, Loader } from '@mantine/core'
import { useSession } from '@/providers/SessionProvider'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { session, isLoading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return
    if (session) {
      navigate({ to: '/sheets', replace: true })
    } else {
      navigate({ to: '/login', replace: true, search: { redirectTo: undefined } })
    }
  }, [session, isLoading, navigate])

  return (
    <Center h="100dvh">
      <Loader color="teal" />
    </Center>
  )
}
