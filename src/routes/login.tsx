import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { signInWithGoogle, signInWithPassword } from '@/lib/auth-requests'
import { useSession } from '@/providers/SessionProvider'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { session, isLoading } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && session) {
      navigate({ to: '/sheets', replace: true })
    }
  }, [session, isLoading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setError(null)
    setIsSubmitting(true)
    try {
      await signInWithPassword(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed')
      setIsGoogleLoading(false)
    }
  }

  return (
    <Center mih="100dvh" p="md">
      <Box w="100%" maw={400}>
        <Stack gap="xl">
          <Stack gap={4} align="center">
            <Title order={1} size="h2">
              Waldas Watch
            </Title>
            <Text c="dimmed" size="sm">
              Sign in to your account
            </Text>
          </Stack>

          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
                autoComplete="email"
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                autoComplete="current-password"
              />
              <Button
                type="submit"
                color="teal"
                fullWidth
                loading={isSubmitting}
                mt="xs"
              >
                Sign in
              </Button>
            </Stack>
          </form>

          <Divider label="or" labelPosition="center" />

          <Button
            variant="default"
            fullWidth
            loading={isGoogleLoading}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>

          <Text ta="center" size="sm">
            Don&apos;t have an account?{' '}
            <Anchor component={Link} to="/signup" c="teal">
              Sign up
            </Anchor>
          </Text>
        </Stack>
      </Box>
    </Center>
  )
}
