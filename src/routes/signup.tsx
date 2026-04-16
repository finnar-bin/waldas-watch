import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { signUpWithPassword } from '@/lib/auth-requests'
import { useSession } from '@/providers/SessionProvider'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const { session, isLoading } = useSession()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && session) {
      navigate({ to: '/sheets', replace: true })
    }
  }, [session, isLoading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName || !email || !password) return
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await signUpWithPassword(email, password, displayName.trim())
      setSuccess(true)
      setDisplayName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Center mih="100dvh" p="md">
      <Box w="100%" maw={400}>
        <Stack gap="xl">
          <Stack gap={4} align="center">
            <Title order={1} size="h2">
              Create account
            </Title>
            <Text c="dimmed" size="sm">
              Start tracking your budget
            </Text>
          </Stack>

          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="teal" variant="light">
              Account created! Check your email to confirm.
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Display name"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
                required
                autoComplete="name"
              />
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
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                autoComplete="new-password"
              />
              <Button
                type="submit"
                color="teal"
                fullWidth
                loading={isSubmitting}
                mt="xs"
              >
                Create account
              </Button>
            </Stack>
          </form>

          <Text ta="center" size="sm">
            Already have an account?{' '}
            <Anchor component={Link} to="/login" c="teal">
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Box>
    </Center>
  )
}
