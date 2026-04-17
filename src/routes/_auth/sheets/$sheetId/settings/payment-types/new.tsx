import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import { Box, Button, Paper, Stack, TextInput } from "@mantine/core";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { IconPickerGrid } from "@/components/IconPickerGrid";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useCreatePaymentTypeMutation } from "@/queries/use-create-payment-type-mutation";
import { ICONS } from "@/lib/constants/icons";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/payment-types/new",
)({
  component: NewPaymentTypePage,
});

interface FormValues {
  name: string;
  icon: string;
}

function NewPaymentTypePage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const createMutation = useCreatePaymentTypeMutation(sheetId);

  const form = useForm<FormValues>({
    initialValues: { name: "", icon: ICONS[0] },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Name is required" : null),
      icon: (v) => (v.length === 0 ? "Pick an icon" : null),
    },
  });

  function handleSubmit(values: FormValues) {
    createMutation.mutate(
      {
        sheetId,
        createdBy: session!.user.id,
        name: values.name.trim(),
        icon: values.icon,
      },
      {
        onSuccess: () =>
          navigate({
            to: "/sheets/$sheetId/settings/payment-types",
            params: { sheetId },
          }),
      },
    );
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="New Payment Type" />
      <BackLink
        to="/sheets/$sheetId/settings/payment-types"
        params={{ sheetId }}
        label="Payment Types"
      />
      <Paper p="md" shadow="sm" radius="lg" m="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Name"
              placeholder="e.g. Debit Card, Cash"
              withAsterisk
              {...form.getInputProps("name")}
            />
            <IconPickerGrid
              label="Icon"
              icons={ICONS}
              value={form.values.icon}
              onChange={(icon) => form.setFieldValue("icon", icon)}
            />
            <Button
              type="submit"
              color="teal"
              loading={createMutation.isPending}
              mt="xs"
            >
              Add payment type
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
