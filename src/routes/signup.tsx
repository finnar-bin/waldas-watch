import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
} from "@mantine/core";
import { useForm, isEmail, isNotEmpty, hasLength } from "@mantine/form";
import { signUpWithPassword } from "@/lib/auth-requests";
import { useSession } from "@/providers/SessionProvider";
import { BadgeCheck, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: { displayName: "", email: "", password: "" },
    validate: {
      displayName: isNotEmpty("Display name is required"),
      email: isEmail("Invalid email"),
      password: hasLength({ min: 6 }, "Password must be at least 6 characters"),
    },
  });

  useEffect(() => {
    if (!isLoading && session) {
      navigate({ to: "/sheets", replace: true });
    }
  }, [session, isLoading, navigate]);

  async function handleSubmit(values: {
    displayName: string;
    email: string;
    password: string;
  }) {
    setError(null);
    setIsSubmitting(true);
    try {
      await signUpWithPassword(
        values.email,
        values.password,
        values.displayName.trim(),
      );
      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Center mih="100dvh" p="md">
      <Box w="100%" maw={400}>
        <Stack gap="xl">
          <Stack gap={4} align="center">
            <img src="/favicon.svg" alt="Waldas Watch" width={64} height={64} />
            <Title order={1} size="h2">
              Create account
            </Title>
            <Text c="dimmed" size="sm">
              Sige na. Your sweldo has been waiting for this.
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

          {success && (
            <Alert
              color="green"
              variant="light"
              title="Account created!"
              icon={<BadgeCheck />}
            ></Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Display name"
                placeholder="Juan Dela Cruz"
                autoComplete="name"
                {...form.getInputProps("displayName")}
              />
              <TextInput
                label="Email"
                type="email"
                placeholder="juandelacruz@pera.ph"
                autoComplete="email"
                {...form.getInputProps("email")}
              />
              <PasswordInput
                label="Password"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                {...form.getInputProps("password")}
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
            Miss us already?{" "}
            <Anchor component={Link} to="/login" c="teal">
              Sign in.
            </Anchor>
          </Text>
        </Stack>
      </Box>
    </Center>
  );
}
