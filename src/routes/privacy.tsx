import { createFileRoute } from "@tanstack/react-router";
import { Anchor, Box, Center, Stack, Text, Title } from "@mantine/core";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Center mih="100dvh" p="xl">
      <Box w="100%" maw={600}>
        <Stack gap="xl">
          <Stack gap={4}>
            <Title order={1} size="h2">
              Privacy Policy
            </Title>
            <Text c="dimmed" size="sm">
              Last updated: April 20, 2026
            </Text>
          </Stack>

          <Stack gap="md">
            <Stack gap={4}>
              <Title order={2} size="h4">
                What we collect
              </Title>
              <Text size="sm">
                When you sign in with Google, we receive your name, email
                address, and profile picture. We also store the expense data
                (sheets, transactions, categories) that you create in the app.
              </Text>
            </Stack>

            <Stack gap={4}>
              <Title order={2} size="h4">
                How we use it
              </Title>
              <Text size="sm">
                Your Google account information is used solely to authenticate
                you and identify your account. Your expense data is stored to
                provide the core functionality of the app.
              </Text>
            </Stack>

            <Stack gap={4}>
              <Title order={2} size="h4">
                Data storage
              </Title>
              <Text size="sm">
                Your data is stored securely via Supabase. We do not sell,
                share, or disclose your personal information to third parties.
              </Text>
            </Stack>

            <Stack gap={4}>
              <Title order={2} size="h4">
                Contact
              </Title>
              <Text size="sm">
                Questions? Reach us at{" "}
                <Anchor href="mailto:narc.ph@gmail.com" c="teal">
                  narc.ph@gmail.com
                </Anchor>
                .
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Center>
  );
}
