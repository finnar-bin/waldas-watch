import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ActionIcon,
  Badge,
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
} from "@mantine/core";
import { ChevronRight, LogOut, Plus } from "lucide-react";
import { signOut } from "@/lib/auth-requests";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useUserInvitesQuery } from "@/queries/use-user-invites-query";
import { useAcceptInviteMutation } from "@/queries/use-accept-invite-mutation";
import { useDeclineInviteMutation } from "@/queries/use-decline-invite-mutation";
import { ROLE_COLORS } from "@/lib/constants/role-colors";

export const Route = createFileRoute("/_auth/sheets/")({
  component: SheetsPage,
});

function SheetsPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const email = session?.user.email;

  const {
    data: sheets,
    isLoading: sheetsLoading,
    isError: sheetsError,
  } = useUserSheetsQuery(session?.user.id);

  const { data: invites, isLoading: invitesLoading } =
    useUserInvitesQuery(email);

  const acceptMutation = useAcceptInviteMutation(email);
  const declineMutation = useDeclineInviteMutation(email);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true, search: { redirectTo: undefined } });
  }

  async function handleAccept(tokenHash: string) {
    const result = await acceptMutation.mutateAsync(tokenHash);
    navigate({ to: "/sheets/$sheetId", params: { sheetId: result.sheetId } });
  }

  const isLoading = sheetsLoading || invitesLoading;

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

      {sheetsError && (
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
          onClick={() => navigate({ to: "/sheets/new" })}
        >
          New Sheet
        </Button>
      </Box>

      {!isLoading && (
        <Stack gap="sm" px="md" pt="sm">
          {invites && invites.length > 0 && (
            <>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>
                Pending Invites
              </Text>
              {invites.map((invite) => (
                <Paper key={invite.id} shadow="sm" radius="lg" p="md">
                  <Stack gap="xs">
                    <Badge
                      size="sm"
                      color={ROLE_COLORS[invite.role]}
                      variant="light"
                    >
                      {invite.role}
                    </Badge>
                    <Text fw={800}>{invite.sheetName}</Text>
                    {invite.invitedByName && (
                      <Text size="xs" c="dimmed">
                        Invited by {invite.invitedByName}
                      </Text>
                    )}
                    <Flex gap="xs" mt={4}>
                      <Button
                        size="xs"
                        color="teal"
                        radius="md"
                        flex={1}
                        loading={
                          acceptMutation.isPending &&
                          acceptMutation.variables === invite.tokenHash
                        }
                        disabled={declineMutation.isPending}
                        onClick={() => handleAccept(invite.tokenHash)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        radius="md"
                        flex={1}
                        loading={
                          declineMutation.isPending &&
                          declineMutation.variables === invite.id
                        }
                        disabled={acceptMutation.isPending}
                        onClick={() => declineMutation.mutateAsync(invite.id)}
                      >
                        Decline
                      </Button>
                    </Flex>
                  </Stack>
                </Paper>
              ))}

              {sheets && sheets.length > 0 && (
                <Text
                  size="xs"
                  fw={700}
                  c="dimmed"
                  tt="uppercase"
                  lts={0.5}
                  mt="xs"
                >
                  My Sheets
                </Text>
              )}
            </>
          )}

          {!sheetsError && sheets?.length === 0 && invites?.length === 0 && (
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
