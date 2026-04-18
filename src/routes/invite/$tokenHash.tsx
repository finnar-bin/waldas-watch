import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Center,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { AlertCircle, CheckCircle, Clock, ShieldOff } from "lucide-react";
import { useSession } from "@/providers/SessionProvider";
import { signOut } from "@/lib/auth-requests";
import { useInviteByTokenQuery } from "@/queries/use-invite-by-token-query";
import { useAcceptInviteMutation } from "@/queries/use-accept-invite-mutation";
import { ROLE_COLORS } from "@/lib/constants/role-colors";

export const Route = createFileRoute("/invite/$tokenHash")({
  component: InvitePage,
});

function InvitePage() {
  const { tokenHash } = Route.useParams();
  const { session, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const { data: invite, isLoading: inviteLoading, error } = useInviteByTokenQuery(tokenHash);
  const acceptMutation = useAcceptInviteMutation();

  async function handleAccept() {
    const result = await acceptMutation.mutateAsync(tokenHash);
    setAccepted(true);
    setTimeout(() => {
      navigate({ to: "/sheets/$sheetId", params: { sheetId: result.sheetId } });
    }, 1500);
  }

  const isExpired =
    invite?.status === "expired" ||
    (!!invite?.expiresAt && new Date(invite.expiresAt) < new Date());

  return (
    <Center mih="100dvh" p="md">
      <Box w="100%" maw={400}>
        <Stack gap="xl">
          <Stack gap={4} align="center">
            <img src="/favicon.svg" alt="Waldas Watch" width={64} height={64} />
            <Title order={1} size="h2">
              Waldas Watch
            </Title>
          </Stack>

          <Paper shadow="sm" radius="lg" p="xl">
            {inviteLoading || sessionLoading ? (
              <Center py="xl">
                <Loader color="teal" size="sm" />
              </Center>
            ) : error ? (
              <Stack align="center" gap="sm">
                <AlertCircle size={36} color="var(--mantine-color-red-6)" />
                <Text fw={600} ta="center">
                  Something went wrong
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {error instanceof Error ? error.message : "Could not load invite. Try again later."}
                </Text>
              </Stack>
            ) : !invite ? (
              <Stack align="center" gap="sm">
                <AlertCircle size={36} color="var(--mantine-color-red-6)" />
                <Text fw={600} ta="center">
                  Invalid invite link
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  This invite doesn't exist or the link is incorrect.
                </Text>
              </Stack>
            ) : accepted ? (
              <Stack align="center" gap="md">
                <CheckCircle size={36} color="var(--mantine-color-teal-6)" />
                <Text fw={600} ta="center">
                  You've joined {invite.sheetName}!
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  Redirecting you to the sheet…
                </Text>
              </Stack>
            ) : invite.status === "revoked" ? (
              <Stack align="center" gap="sm">
                <ShieldOff size={36} color="var(--mantine-color-red-6)" />
                <Text fw={600} ta="center">
                  Invite revoked
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  This invite has been revoked. Ask the sheet admin for a new one.
                </Text>
              </Stack>
            ) : invite.status === "accepted" ? (
              <Stack align="center" gap="sm">
                <CheckCircle size={36} color="var(--mantine-color-teal-6)" />
                <Text fw={600} ta="center">
                  Already accepted
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  This invite has already been accepted.
                </Text>
                <Button
                  variant="light"
                  color="teal"
                  fullWidth
                  onClick={() =>
                    navigate({
                      to: "/sheets/$sheetId",
                      params: { sheetId: invite.sheetId },
                    })
                  }
                >
                  Go to sheet
                </Button>
              </Stack>
            ) : isExpired ? (
              <Stack align="center" gap="sm">
                <Clock size={36} color="var(--mantine-color-orange-6)" />
                <Text fw={600} ta="center">
                  Invite expired
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  This invite expired on{" "}
                  {new Date(invite.expiresAt).toLocaleDateString()}. Ask the
                  sheet admin for a new one.
                </Text>
              </Stack>
            ) : (
              <Stack gap="md">
                <Text fw={600} ta="center">
                  You've been invited to
                </Text>
                <Text size="xl" fw={700} ta="center">
                  {invite.sheetName}
                </Text>
                <Center>
                  <Badge size="md" color={ROLE_COLORS[invite.role]} variant="light">
                    {invite.role}
                  </Badge>
                </Center>
                <Text size="xs" c="dimmed" ta="center">
                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                </Text>
                {!session ? (
                  <Button
                    color="teal"
                    fullWidth
                    mt="xs"
                    onClick={() =>
                      navigate({
                        to: "/login",
                        search: { redirectTo: `/invite/${tokenHash}` },
                      })
                    }
                  >
                    Sign in to accept
                  </Button>
                ) : session.user.email !== invite.invitedEmail ? (
                  <Stack gap="md">
                    <Text size="sm" c="dimmed" ta="center">
                      This invite is for{" "}
                      <Text component="span" fw={600} c="dark">
                        {invite.invitedEmail}
                      </Text>
                      , but you're signed in as{" "}
                      <Text component="span" fw={600} c="dark">
                        {session.user.email}
                      </Text>
                      .
                    </Text>
                    <Button
                      variant="light"
                      color="teal"
                      fullWidth
                      onClick={async () => {
                        await signOut();
                        navigate({
                          to: "/login",
                          search: { redirectTo: `/invite/${tokenHash}` },
                        });
                      }}
                    >
                      Switch account
                    </Button>
                  </Stack>
                ) : (
                  <Button
                    color="teal"
                    fullWidth
                    mt="xs"
                    loading={acceptMutation.isPending}
                    onClick={handleAccept}
                  >
                    Accept invite
                  </Button>
                )}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Box>
    </Center>
  );
}
