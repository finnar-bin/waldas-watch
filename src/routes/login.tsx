import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
} from "@mantine/core";
import { useForm, isEmail, isNotEmpty } from "@mantine/form";
import { signInWithGoogle, signInWithPassword } from "@/lib/auth-requests";
import { useSession } from "@/providers/SessionProvider";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();
  const { redirectTo } = Route.useSearch();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: { email: "", password: "" },
    validate: {
      email: isEmail("Invalid email"),
      password: isNotEmpty("Password is required"),
    },
  });

  useEffect(() => {
    if (!isLoading && session) {
      navigate({ to: redirectTo ?? "/sheets", replace: true });
    }
  }, [session, isLoading, navigate, redirectTo]);

  async function handleSubmit(values: { email: string; password: string }) {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithPassword(values.email, values.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
      setIsGoogleLoading(false);
    }
  }

  return (
    <Center mih="100dvh" p="md">
      <Box w="100%" maw={400}>
        <Stack gap="xl">
          <Stack gap={4} align="center">
            <img src="/favicon.png" alt="Waldas Watch" width={64} height={64} />
            <Title order={1} size="h2">
              Waldas Watch
            </Title>
            <Text c="dimmed" size="sm">
              Because &ldquo;bahala na&rdquo; is not a financial plan.
            </Text>
          </Stack>

          {error && (
            <Alert
              color="red"
              variant="light"
              title={error}
              icon={<ShieldAlert />}
            ></Alert>
          )}

          <Stack gap="xs">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="juandelacruz@pera.ph"
                  autoComplete="email"
                  {...form.getInputProps("email")}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  {...form.getInputProps("password")}
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
          </Stack>

          <Text ta="center" size="sm">
            Still spending blind?{" "}
            <Anchor component={Link} to="/signup" search={{ redirectTo }} c="teal">
              Sign up.
            </Anchor>
          </Text>
        </Stack>
      </Box>
    </Center>
  );
}
