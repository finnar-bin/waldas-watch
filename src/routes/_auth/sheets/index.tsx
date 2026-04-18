import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Flex,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
  Badge,
} from "@mantine/core";
import { ChevronRight, LogOut, Plus } from "lucide-react";
import { signOut } from "@/lib/auth-requests";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { ROLE_COLORS } from "@/lib/constants/role-colors";

export const Route = createFileRoute("/_auth/sheets/")({
  component: SheetsPage,
});

function SheetsPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const {
    data: sheets,
    isLoading,
    isError,
  } = useUserSheetsQuery(session?.user.id);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <Box mih="100dvh" pb={80}>
      <Flex align="center" justify="space-between" px="md" py="sm">
        <Title order={3} fw={900} lh={1.3}>
          My Sheets
        </Title>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut size={18} />
        </ActionIcon>
      </Flex>

      {isLoading && (
        <Center py="xl">
          <Loader color="teal" />
        </Center>
      )}

      {isError && (
        <Center py="xl">
          <Text c="red" size="sm">
            Failed to load sheets. Please try again.
          </Text>
        </Center>
      )}

      <Box
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "var(--mantine-spacing-md)",
          background: "linear-gradient(to top, #F5F0E8 60%, transparent)",
        }}
      >
        <Button
          fullWidth
          color="teal"
          radius="md"
          size="md"
          leftSection={<Plus size={18} />}
        >
          New Sheet
        </Button>
      </Box>

      {!isLoading && !isError && (
        <Stack gap="sm" px="md" pt="sm">
          {sheets?.length === 0 && (
            <Center py="xl">
              <Text c="dimmed" size="sm">
                No sheets yet.
              </Text>
            </Center>
          )}
          {sheets?.map((sheet) => (
            <Paper key={sheet.id} shadow="sm" radius="lg">
              <UnstyledButton
                p="md"
                w="100%"
                onClick={() =>
                  navigate({
                    to: "/sheets/$sheetId",
                    params: { sheetId: sheet.id },
                  })
                }
              >
                <Flex align="center" gap="sm">
                  <Box flex={1}>
                    <Badge
                      size="sm"
                      color={ROLE_COLORS[sheet.role]}
                      variant="light"
                    >
                      {sheet.role}
                    </Badge>
                    <Text fw={800}>{sheet.name}</Text>
                    {sheet.description && (
                      <Text size="xs" c="dimmed">
                        {sheet.description}
                      </Text>
                    )}
                  </Box>
                  <ChevronRight
                    size={16}
                    color="var(--mantine-color-gray-5)"
                    strokeWidth={4}
                  />
                </Flex>
              </UnstyledButton>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
