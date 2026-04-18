import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDisclosure } from "@mantine/hooks";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { Check, Copy, UserPlus, X } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetMembersQuery } from "@/queries/use-sheet-members-query";
import { useSheetInvitesQuery } from "@/queries/use-sheet-invites-query";
import { useRevokeInviteMutation } from "@/queries/use-revoke-invite-mutation";
import { useRemoveSheetMemberMutation } from "@/queries/use-remove-sheet-member-mutation";
import type { SheetMember, SheetInvite } from "@/lib/sheet-members-requests";
import { getInitials } from "@/lib/get-initials";
import { ROLE_COLORS } from "@/lib/constants/role-colors";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/manage-users/",
)({
  component: ManageUsersPage,
});

function ManageUsersPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheet = sheets?.find((s) => s.id === sheetId);
  const sheetName = sheet?.name ?? "…";
  const isAdmin = sheet?.role === "admin";

  const { data: members = [] } = useSheetMembersQuery(sheetId);
  const { data: invites = [] } = useSheetInvitesQuery(sheetId);

  const revokeMutation = useRevokeInviteMutation(sheetId);
  const removeMutation = useRemoveSheetMemberMutation(sheetId);

  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SheetMember | null>(null);

  const [removeOpened, { open: openRemove, close: closeRemove }] =
    useDisclosure(false);

  function handleOpenRemove(member: SheetMember) {
    setRemoveTarget(member);
    openRemove();
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeMutation.mutate(removeTarget.id, { onSuccess: closeRemove });
  }

  function handleRevoke(invite: SheetInvite) {
    revokeMutation.mutate(invite.id);
  }

  async function handleCopyLink(invite: SheetInvite) {
    const url = `${window.location.origin}/invite/${invite.tokenHash}`;
    await navigator.clipboard.writeText(url);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  }

  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <>
      <Modal
        opened={removeOpened}
        onClose={closeRemove}
        title={
          <Text size="lg" fw={700}>
            Remove member
          </Text>
        }
        centered
      >
        <Text size="sm">
          Remove{" "}
          <Text component="span" fw={600}>
            {removeTarget?.displayName || removeTarget?.email}
          </Text>{" "}
          from this sheet?
        </Text>
        <Group grow mt="lg">
          <Button variant="default" onClick={closeRemove}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={removeMutation.isPending}
            onClick={handleRemove}
          >
            Remove
          </Button>
        </Group>
      </Modal>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Manage Users" />
        <BackLink
          to="/sheets/$sheetId/settings"
          params={{ sheetId }}
          label="Settings"
          rightSection={
            isAdmin ? (
              <Button
                size="xs"
                color="teal"
                leftSection={<UserPlus size={14} />}
                onClick={() =>
                  navigate({
                    to: "/sheets/$sheetId/settings/manage-users/invite",
                    params: { sheetId },
                  })
                }
              >
                Invite
              </Button>
            ) : null
          }
        />
        <Box p="md">
          {invites.length > 0 && (
            <Stack gap="xs" mb="md">
              <Text
                size="xs"
                fw={600}
                c="dimmed"
                tt="uppercase"
                style={{ letterSpacing: 1 }}
              >
                Pending invites
              </Text>
              <Paper radius="lg" shadow="sm" style={{ overflow: "hidden" }}>
                {invites.map((invite, index) => (
                  <Group
                    key={invite.id}
                    px="md"
                    py="sm"
                    justify="space-between"
                    style={{
                      borderBottom:
                        index < invites.length - 1
                          ? "1px solid var(--mantine-color-gray-1)"
                          : undefined,
                      minHeight: 56,
                    }}
                  >
                    <div>
                      <Text size="sm" fw={500}>
                        {invite.invitedEmail}
                      </Text>
                      <Group gap={6}>
                        <Badge
                          size="xs"
                          color={ROLE_COLORS[invite.role]}
                          variant="light"
                        >
                          {invite.role}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Expires{" "}
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </div>
                    <Group gap={4}>
                      <Button
                        size="xs"
                        variant="subtle"
                        color={copiedInviteId === invite.id ? "teal" : "gray"}
                        leftSection={copiedInviteId === invite.id ? <Check size={12} /> : <Copy size={12} />}
                        onClick={() => handleCopyLink(invite)}
                      >
                        {copiedInviteId === invite.id ? "Copied!" : "Copy link"}
                      </Button>
                      {isAdmin && (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          leftSection={<X size={12} />}
                          loading={revokeMutation.isPending}
                          onClick={() => handleRevoke(invite)}
                        >
                          Revoke
                        </Button>
                      )}
                    </Group>
                  </Group>
                ))}
              </Paper>
            </Stack>
          )}

          <Stack gap="xs">
            <Text
              size="xs"
              fw={600}
              c="dimmed"
              tt="uppercase"
              style={{ letterSpacing: 1 }}
            >
              Members
            </Text>
            <Paper radius="lg" shadow="sm" style={{ overflow: "hidden" }}>
              {members.map((member, index) => {
                const isCurrentUser = member.userId === session?.user.id;
                const canRemove =
                  isAdmin &&
                  !isCurrentUser &&
                  !(member.role === "admin" && adminCount <= 1);

                return (
                  <Group
                    key={member.id}
                    px="md"
                    py="sm"
                    justify="space-between"
                    style={{
                      borderBottom:
                        index < members.length - 1
                          ? "1px solid var(--mantine-color-gray-1)"
                          : undefined,
                      minHeight: 60,
                    }}
                  >
                    <Group gap="sm">
                      <Avatar
                        radius="xl"
                        size="sm"
                        color="teal"
                        src={member.avatarUrl ?? undefined}
                      >
                        {getInitials(member.displayName, member.email)}
                      </Avatar>
                      <div>
                        <Group gap={6} align="center">
                          <Text size="sm" fw={500}>
                            {member.displayName || member.email || "Unknown"}
                          </Text>
                          {isCurrentUser && (
                            <Text size="xs" c="dimmed">
                              (you)
                            </Text>
                          )}
                        </Group>
                        {member.displayName && member.email && (
                          <Text size="xs" c="dimmed">
                            {member.email}
                          </Text>
                        )}
                      </div>
                    </Group>
                    <Group gap="sm">
                      <Badge
                        size="sm"
                        color={ROLE_COLORS[member.role]}
                        variant="light"
                      >
                        {member.role}
                      </Badge>
                      {canRemove && (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          leftSection={<X size={12} />}
                          onClick={() => handleOpenRemove(member)}
                        >
                          Remove
                        </Button>
                      )}
                    </Group>
                  </Group>
                );
              })}
            </Paper>
          </Stack>
        </Box>
      </Box>
    </>
  );
}
