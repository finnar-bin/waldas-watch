import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import { Box, Button, Select, Stack, Text, TextInput } from "@mantine/core";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useInviteUserMutation } from "@/queries/use-invite-user-mutation";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/manage-users/invite",
)({
  component: InviteUserPage,
});

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

interface FormValues {
  email: string;
  role: "viewer" | "editor" | "admin";
}

function InviteUserPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const inviteMutation = useInviteUserMutation(sheetId);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { email: "", role: "viewer" },
    validate: {
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? null
          : "Enter a valid email",
    },
  });

  async function handleSubmit(values: FormValues) {
    const result = await inviteMutation.mutateAsync({
      sheetId,
      invitedEmail: values.email.trim(),
      role: values.role,
      invitedBy: session!.user.id,
    });
    setInviteLink(result.inviteUrl);
  }

  const backLink = (
    <BackLink
      to="/sheets/$sheetId/settings/manage-users"
      params={{ sheetId }}
      label="Manage Users"
    />
  );

  if (inviteLink) {
    return (
      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Invite Sent" />
        {backLink}
        <Box p="md">
          <Stack gap="sm">
            <Text size="sm">Share this link with them:</Text>
            <TextInput
              value={inviteLink}
              readOnly
              onClick={(e) => e.currentTarget.select()}
            />
            <Text size="xs" c="dimmed">
              Expires in 7 days.
            </Text>
            <Button
              color="teal"
              onClick={() =>
                navigate({
                  to: "/sheets/$sheetId/settings/manage-users",
                  params: { sheetId },
                })
              }
            >
              Done
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Invite Someone" />
      {backLink}
      <Box p="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Email"
              placeholder="name@example.com"
              {...form.getInputProps("email")}
            />
            <Select
              label="Role"
              data={ROLE_OPTIONS}
              allowDeselect={false}
              {...form.getInputProps("role")}
            />
            <Button
              type="submit"
              color="teal"
              loading={inviteMutation.isPending}
              mt="xs"
            >
              Send invite
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
