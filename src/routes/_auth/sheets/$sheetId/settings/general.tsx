import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "@mantine/form";
import { Box, Button, Select, Stack, Textarea, TextInput } from "@mantine/core";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";
import { useUpdateSheetMutation } from "@/queries/use-update-sheet-mutation";
import { useUpdateSheetCurrencyMutation } from "@/queries/use-update-sheet-currency-mutation";
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

  const isPending = sheetPending || currencyPending;
  const isSuccess = sheetSuccess && currencySuccess;

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

  return (
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
              withAsterisk
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
              withAsterisk
            />
            <Button
              type="submit"
              color="teal"
              loading={isPending}
              disabled={!form.isDirty()}
            >
              {isSuccess && !form.isDirty() ? "Saved" : "Save changes"}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
