import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Switch,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { Info, Trash2 } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";
import { useSheetBudgetRolloverQuery } from "@/queries/use-sheet-budget-rollover-query";
import { useUpdateSheetMutation } from "@/queries/use-update-sheet-mutation";
import { useUpdateSheetCurrencyMutation } from "@/queries/use-update-sheet-currency-mutation";
import { useUpdateSheetBudgetRolloverMutation } from "@/queries/use-update-sheet-budget-rollover-mutation";
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
  budgetRolloverEnabled: boolean;
}

function GeneralSettingsPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheet = sheets?.find((s) => s.id === sheetId);
  const sheetName = sheet?.name ?? "…";

  const { data: currency } = useSheetCurrencyQuery(sheetId);
  const { data: budgetRollover } = useSheetBudgetRolloverQuery(sheetId);

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
  const {
    mutate: mutateBudgetRollover,
    isPending: budgetRolloverPending,
    isSuccess: budgetRolloverSuccess,
  } = useUpdateSheetBudgetRolloverMutation(sheetId);
  const deleteMutation = useDeleteSheetMutation(session?.user.id);

  const isPending = sheetPending || currencyPending || budgetRolloverPending;
  const isSuccess = sheetSuccess && currencySuccess && budgetRolloverSuccess;

  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      description: "",
      currency: "USD",
      budgetRolloverEnabled: false,
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Name is required" : null),
    },
  });

  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (sheet && currency && budgetRollover && !hasSeededRef.current) {
      hasSeededRef.current = true;
      const values = {
        name: sheet.name,
        description: sheet.description ?? "",
        currency,
        budgetRolloverEnabled: budgetRollover.enabled,
      };
      form.setValues(values);
      form.resetDirty(values);
    }
  }, [sheet, currency, budgetRollover]);

  function handleSubmit(values: FormValues) {
    let completed = 0;
    const onAllDone = () => {
      completed++;
      if (completed === 3) form.resetDirty();
    };

    mutateSheet(
      {
        name: values.name.trim(),
        description: values.description.trim() || null,
      },
      { onSuccess: onAllDone },
    );
    mutateCurrency(
      { currency: values.currency, updatedBy: session!.user.id },
      { onSuccess: onAllDone },
    );
    mutateBudgetRollover(
      { enabled: values.budgetRolloverEnabled, updatedBy: session!.user.id },
      { onSuccess: onAllDone },
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
              <Switch
                mt="6px"
                label={
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={500}>
                      Carry over unused budget
                    </Text>
                    <Tooltip
                      label="If a category's budget isn't fully spent, the leftover carries into next month's budget for that category. Going over budget doesn't carry over — only unused amounts do."
                      withArrow
                      multiline
                      w={240}
                      events={{ hover: true, focus: true, touch: true }}
                    >
                      <Info
                        size={14}
                        style={{ cursor: "help", flexShrink: 0 }}
                      />
                    </Tooltip>
                  </Group>
                }
                description="Di nagastos last month? Idadagdag sa budget ngayong buwan — pero 'wag umasa, ha."
                {...form.getInputProps("budgetRolloverEnabled", {
                  type: "checkbox",
                })}
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
