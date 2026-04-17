import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { Trash2 } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";
import { useUpdateSheetMutation } from "@/queries/use-update-sheet-mutation";
import { useUpdateSheetCurrencyMutation } from "@/queries/use-update-sheet-currency-mutation";
import { useDeleteSheetMutation } from "@/queries/use-delete-sheet-mutation";
import { CURRENCIES } from "@/lib/constants/currencies";

export const Route = createFileRoute("/_auth/sheets/$sheetId/settings/general")(
  {
    component: GeneralSettingsPage,
  },
);

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} – ${c.name}`,
}));

interface FormValues {
  name: string;
  description: string;
  currency: string;
}

function GeneralSettingsPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheet = sheets?.find((s) => s.id === sheetId);
  const sheetName = sheet?.name ?? "…";

  const { data: currency } = useSheetCurrencyQuery(sheetId);

  const {
    mutate: mutateSheet,
    isPending: sheetPending,
    isSuccess: sheetSuccess,
  } = useUpdateSheetMutation(sheetId, session?.user.id);
  const {
    mutate: mutateCurrency,
    isPending: currencyPending,
    isSuccess: currencySuccess,
  } = useUpdateSheetCurrencyMutation(sheetId);
  const deleteMutation = useDeleteSheetMutation(session?.user.id);

  const isPending = sheetPending || currencyPending;
  const isSuccess = sheetSuccess && currencySuccess;

  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");

  const form = useForm<FormValues>({
    initialValues: { name: "", description: "", currency: "USD" },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Name is required" : null),
    },
  });

  useEffect(() => {
    if (sheet && currency && !form.isDirty()) {
      form.setValues({
        name: sheet.name,
        description: sheet.description ?? "",
        currency,
      });
    }
  }, [sheet, currency]);

  function handleSubmit(values: FormValues) {
    let completed = 0;
    const onBothDone = () => {
      completed++;
      if (completed === 2) form.resetDirty();
    };

    mutateSheet(
      {
        name: values.name.trim(),
        description: values.description.trim() || null,
      },
      { onSuccess: onBothDone },
    );
    mutateCurrency(
      { currency: values.currency, updatedBy: session!.user.id },
      { onSuccess: onBothDone },
    );
  }

  function handleOpenDeleteModal() {
    setDeleteConfirmValue("");
    openDeleteModal();
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(sheetId);
    navigate({ to: "/sheets", replace: true });
  }

  return (
    <>
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={
          <Text size="lg" fw={700}>
            Delete sheet
          </Text>
        }
        centered
      >
        <Text size="sm">
          This will permanently delete{" "}
          <Text component="span" fw={600}>
            {sheetName}
          </Text>{" "}
          along with all its transactions, categories, and settings. No undo, no
          recovery, no take-backs.
        </Text>
        <TextInput
          mt="md"
          label={
            <Text size="sm" mb={4}>
              Type{" "}
              <Text component="span" fw={600}>
                {sheetName}
              </Text>{" "}
              to confirm
            </Text>
          }
          placeholder={sheetName}
          value={deleteConfirmValue}
          onChange={(e) => setDeleteConfirmValue(e.currentTarget.value)}
        />
        <Group grow mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteMutation.isPending}
            disabled={deleteConfirmValue !== sheetName}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Group>
      </Modal>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="General Settings" />
        <BackLink
          to="/sheets/$sheetId/settings"
          params={{ sheetId }}
          label="Settings"
        />
        <Box p="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Name"
                placeholder="e.g. Household expenses, Europe trip 🌍"
                {...form.getInputProps("name")}
              />
              <Textarea
                label="Description"
                placeholder="e.g. Tracking every coffee ☕ and questionable late-night purchase"
                rows={3}
                {...form.getInputProps("description")}
              />
              <Select
                label="Currency"
                data={CURRENCY_OPTIONS}
                searchable
                allowDeselect={false}
                {...form.getInputProps("currency")}
              />
              <Button
                type="submit"
                color="teal"
                loading={isPending}
                disabled={!form.isDirty()}
                mt="xs"
              >
                {isSuccess && !form.isDirty() ? "Saved" : "Save changes"}
              </Button>
              <Divider />
              <Button
                variant="outline"
                color="red"
                leftSection={<Trash2 size={16} />}
                onClick={handleOpenDeleteModal}
                disabled={isPending}
              >
                Delete sheet
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </>
  );
}
