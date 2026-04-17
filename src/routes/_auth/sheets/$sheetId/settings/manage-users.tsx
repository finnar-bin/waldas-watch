import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { UserPlus, X } from 'lucide-react'
import { SheetHeader } from '@/components/SheetHeader'
import { BackLink } from '@/components/BackLink'
import { useSession } from '@/providers/SessionProvider'
import { useUserSheetsQuery } from '@/queries/use-user-sheets-query'
import { useSheetMembersQuery } from '@/queries/use-sheet-members-query'
import { useSheetInvitesQuery } from '@/queries/use-sheet-invites-query'
import { useInviteUserMutation } from '@/queries/use-invite-user-mutation'
import { useRevokeInviteMutation } from '@/queries/use-revoke-invite-mutation'
import { useRemoveSheetMemberMutation } from '@/queries/use-remove-sheet-member-mutation'
import type { SheetMember, SheetInvite } from '@/lib/sheet-members-requests'

export const Route = createFileRoute('/_auth/sheets/$sheetId/settings/manage-users')({
  component: ManageUsersPage,
})

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
]

const ROLE_COLORS: Record<string, string> = {
  admin: 'teal',
  editor: 'blue',
  viewer: 'gray',
}

interface InviteFormValues {
  email: string
  role: 'viewer' | 'editor' | 'admin'
}

function getInitials(name: string | null, email: string | null): string {
  const source = name || email || '?'
  return source
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function ManageUsersPage() {
  const { sheetId } = Route.useParams()
  const { session } = useSession()

  const { data: sheets } = useUserSheetsQuery(session?.user.id)
  const sheet = sheets?.find((s) => s.id === sheetId)
  const sheetName = sheet?.name ?? '…'
  const currentUserRole = sheet?.role

  const { data: members = [] } = useSheetMembersQuery(sheetId)
  const { data: invites = [] } = useSheetInvitesQuery(sheetId)

  const inviteMutation = useInviteUserMutation(sheetId)
  const revokeMutation = useRevokeInviteMutation(sheetId)
  const removeMutation = useRemoveSheetMemberMutation(sheetId)

  const [inviteOpened, { open: openInvite, close: closeInvite }] = useDisclosure(false)
  const [removeTarget, setRemoveTarget] = useState<SheetMember | null>(null)
  const [removeOpened, { open: openRemove, close: closeRemove }] = useDisclosure(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const isAdmin = currentUserRole === 'admin'

  const form = useForm<InviteFormValues>({
    initialValues: { email: '', role: 'viewer' },
    validate: {
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email',
    },
  })

  function handleOpenInvite() {
    form.reset()
    setInviteLink(null)
    openInvite()
  }

  function handleCloseInvite() {
    closeInvite()
    setInviteLink(null)
  }

  async function handleInviteSubmit(values: InviteFormValues) {
    const result = await inviteMutation.mutateAsync({
      sheetId,
      invitedEmail: values.email.trim(),
      role: values.role,
      invitedBy: session!.user.id,
    })
    setInviteLink(result.inviteUrl)
  }

  function handleOpenRemove(member: SheetMember) {
    setRemoveTarget(member)
    openRemove()
  }

  function handleRemove() {
    if (!removeTarget) return
    removeMutation.mutate(removeTarget.id, { onSuccess: closeRemove })
  }

  function handleRevoke(invite: SheetInvite) {
    revokeMutation.mutate(invite.id)
  }

  const adminCount = members.filter((m) => m.role === 'admin').length

  return (
    <>
      <Modal
        opened={inviteOpened}
        onClose={handleCloseInvite}
        title={<Text size="lg" fw={700}>Invite someone</Text>}
        centered
      >
        {inviteLink ? (
          <Stack gap="sm">
            <Text size="sm">Invite created. Share this link with them:</Text>
            <TextInput
              value={inviteLink}
              readOnly
              onClick={(e) => e.currentTarget.select()}
            />
            <Text size="xs" c="dimmed">Link expires in 7 days.</Text>
            <Button color="teal" onClick={handleCloseInvite}>Done</Button>
          </Stack>
        ) : (
          <form onSubmit={form.onSubmit(handleInviteSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="name@example.com"
                withAsterisk
                {...form.getInputProps('email')}
              />
              <Select
                label="Role"
                data={ROLE_OPTIONS}
                allowDeselect={false}
                withAsterisk
                {...form.getInputProps('role')}
              />
              <Group grow mt="xs">
                <Button variant="default" onClick={handleCloseInvite}>Cancel</Button>
                <Button type="submit" color="teal" loading={inviteMutation.isPending}>
                  Send invite
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      <Modal
        opened={removeOpened}
        onClose={closeRemove}
        title={<Text size="lg" fw={700}>Remove member</Text>}
        centered
      >
        <Text size="sm">
          Remove{' '}
          <Text component="span" fw={600}>
            {removeTarget?.displayName || removeTarget?.email}
          </Text>{' '}
          from this sheet?
        </Text>
        <Group grow mt="lg">
          <Button variant="default" onClick={closeRemove}>Cancel</Button>
          <Button color="red" loading={removeMutation.isPending} onClick={handleRemove}>
            Remove
          </Button>
        </Group>
      </Modal>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Manage Users" />
        <BackLink to="/sheets/$sheetId/settings" params={{ sheetId }} label="Settings" />
        <Box p="md">
          {isAdmin && (
            <Group justify="flex-end" mb="md">
              <Button
                size="xs"
                color="teal"
                leftSection={<UserPlus size={14} />}
                onClick={handleOpenInvite}
              >
                Invite
              </Button>
            </Group>
          )}

          {invites.length > 0 && (
            <Stack gap="xs" mb="md">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
                Pending invites
              </Text>
              <Paper radius="lg" shadow="sm" style={{ overflow: 'hidden' }}>
                {invites.map((invite, index) => (
                  <Group
                    key={invite.id}
                    px="md"
                    py="sm"
                    justify="space-between"
                    style={{
                      borderBottom:
                        index < invites.length - 1
                          ? '1px solid var(--mantine-color-gray-1)'
                          : undefined,
                      minHeight: 56,
                    }}
                  >
                    <div>
                      <Text size="sm" fw={500}>{invite.invitedEmail}</Text>
                      <Group gap={6}>
                        <Badge size="xs" color={ROLE_COLORS[invite.role]} variant="light">
                          {invite.role}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </div>
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
                ))}
              </Paper>
            </Stack>
          )}

          <Stack gap="xs">
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
              Members
            </Text>
            <Paper radius="lg" shadow="sm" style={{ overflow: 'hidden' }}>
              {members.map((member, index) => {
                const isCurrentUser = member.userId === session?.user.id
                const canRemove =
                  isAdmin &&
                  !isCurrentUser &&
                  !(member.role === 'admin' && adminCount <= 1)

                return (
                  <Group
                    key={member.id}
                    px="md"
                    py="sm"
                    justify="space-between"
                    style={{
                      borderBottom:
                        index < members.length - 1
                          ? '1px solid var(--mantine-color-gray-1)'
                          : undefined,
                      minHeight: 60,
                    }}
                  >
                    <Group gap="sm">
                      <Avatar radius="xl" size="sm" color="teal">
                        {getInitials(member.displayName, member.email)}
                      </Avatar>
                      <div>
                        <Group gap={6} align="center">
                          <Text size="sm" fw={500}>
                            {member.displayName || member.email || 'Unknown'}
                          </Text>
                          {isCurrentUser && (
                            <Text size="xs" c="dimmed">(you)</Text>
                          )}
                        </Group>
                        {member.displayName && member.email && (
                          <Text size="xs" c="dimmed">{member.email}</Text>
                        )}
                      </div>
                    </Group>
                    <Group gap="sm">
                      <Badge size="sm" color={ROLE_COLORS[member.role]} variant="light">
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
                )
              })}
            </Paper>
          </Stack>
        </Box>
      </Box>
    </>
  )
}
