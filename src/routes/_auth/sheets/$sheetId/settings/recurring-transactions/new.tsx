import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import {
  Box,
  Button,
  NumberInput,
  Paper,
  Select,
  Stack,
  Textarea,
} from "@mantine/core";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { IconCombobox } from "@/components/IconCombobox";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useCreateRecurringTransactionMutation } from "@/queries/use-create-recurring-transaction-mutation";
import { useSheetTransactionCategoriesQuery } from "@/queries/use-sheet-transaction-categories-query";
import { useSheetPaymentTypesQuery } from "@/queries/use-sheet-payment-types-query";
import type { RecurringFrequency } from "@/lib/recurring-transactions-requests";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/recurring-transactions/new",
)({
  component: NewRecurringPage,
});

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

interface FormValues {
  type: "income" | "expense";
  categoryId: string;
  paymentTypeId: string;
  amount: number | "";
  frequency: RecurringFrequency;
  dayOfMonth: number | "";
  description: string;
}

function NewRecurringPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const createMutation = useCreateRecurringTransactionMutation(sheetId);

  const form = useForm<FormValues>({
    initialValues: {
      type: "expense",
      categoryId: "",
      paymentTypeId: "",
      amount: "",
      frequency: "monthly",
      dayOfMonth: "",
      description: "",
    },
    validate: {
      categoryId: (v) => (v.length === 0 ? "Category is required" : null),
      amount: (v) =>
        v === "" || Number(v) <= 0 ? "Enter a valid amount" : null,
      paymentTypeId: (v, values) => {
        console.log("value", v, values);
        return values.type === "expense" && !v
          ? "Payment type is required"
          : null;
      },
    },
  });

  const { data: categories = [] } = useSheetTransactionCategoriesQuery(
    sheetId,
    form.values.type,
  );
  const { data: paymentTypes = [] } = useSheetPaymentTypesQuery(sheetId);

  function handleTypeChange(type: "income" | "expense") {
    form.setFieldValue("type", type);
    form.setFieldValue("categoryId", "");
  }

  function handleSubmit(values: FormValues) {
    createMutation.mutate(
      {
        sheetId,
        createdBy: session!.user.id,
        type: values.type,
        categoryId: values.categoryId,
        paymentTypeId:
          values.type === "expense" && values.paymentTypeId
            ? values.paymentTypeId
            : null,
        amount: Number(values.amount),
        description: values.description.trim() || null,
        frequency: values.frequency,
        dayOfMonth:
          values.frequency === "monthly" && values.dayOfMonth !== ""
            ? Number(values.dayOfMonth)
            : null,
      },
      {
        onSuccess: () =>
          navigate({
            to: "/sheets/$sheetId/settings/recurring-transactions",
            params: { sheetId },
          }),
      },
    );
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="New Recurring" />
      <BackLink
        to="/sheets/$sheetId/settings/recurring-transactions"
        params={{ sheetId }}
        label="Recurring"
      />
      <Paper p="md" shadow="sm" radius="lg" m="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Type"
              data={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
              allowDeselect={false}
              value={form.values.type}
              onChange={(v) => handleTypeChange(v as "income" | "expense")}
              error={form.errors.type}
            />
            <IconCombobox
              label="Category"
              placeholder="Select a category"
              items={categories.map((c) => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
              }))}
              value={form.values.categoryId || null}
              onChange={(v) => form.setFieldValue("categoryId", v ?? "")}
              error={form.errors.categoryId}
            />
            {form.values.type === "expense" && (
              <IconCombobox
                label="Payment type"
                placeholder="Select a payment type"
                items={paymentTypes.map((p) => ({
                  id: p.id,
                  name: p.name,
                  icon: p.icon,
                }))}
                value={form.values.paymentTypeId || null}
                onChange={(v) => form.setFieldValue("paymentTypeId", v ?? "")}
                error={form.errors.paymentTypeId}
              />
            )}
            <NumberInput
              label="Amount"
              placeholder="0.00"
              min={0.01}
              decimalScale={2}
              {...form.getInputProps("amount")}
            />
            <Select
              label="Frequency"
              data={FREQUENCY_OPTIONS}
              allowDeselect={false}
              {...form.getInputProps("frequency")}
            />
            {form.values.frequency === "monthly" && (
              <NumberInput
                label="Day of month"
                placeholder="e.g. 1, 15, 28"
                min={1}
                max={31}
                {...form.getInputProps("dayOfMonth")}
              />
            )}
            <Textarea
              label="Description"
              placeholder="e.g. Monthly rent"
              rows={2}
              {...form.getInputProps("description")}
            />
            <Button
              type="submit"
              color="teal"
              loading={createMutation.isPending}
              mt="xs"
            >
              Add recurring
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
