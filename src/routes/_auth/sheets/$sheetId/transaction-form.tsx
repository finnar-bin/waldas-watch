import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import "@mantine/dates/styles.css";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { IconCombobox } from "@/components/IconCombobox";
import { SheetHeader } from "@/components/SheetHeader";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetTransactionCategoriesQuery } from "@/queries/use-sheet-transaction-categories-query";
import { useSheetPaymentTypesQuery } from "@/queries/use-sheet-payment-types-query";
import { useCreateSheetTransactionMutation } from "@/queries/use-create-sheet-transaction-mutation";

export const Route = createFileRoute("/_auth/sheets/$sheetId/transaction-form")(
  {
    component: TransactionFormPage,
  },
);

interface FormValues {
  type: "expense" | "income";
  categoryId: string | null;
  paymentTypeId: string | null;
  amount: number | string;
  date: Date | null;
  description: string;
}

function TransactionFormPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    initialValues: {
      type: "expense",
      categoryId: null,
      paymentTypeId: null,
      amount: "",
      date: new Date(),
      description: "",
    },
    validate: {
      categoryId: (v) => (v ? null : "Category is required"),
      amount: (v) => (Number(v) > 0 ? null : "Amount must be greater than 0"),
      date: (v) =>
        v instanceof Date && !isNaN(v.getTime()) ? null : "Date is required",
      paymentTypeId: (v, values) =>
        values.type === "expense" && !v ? "Payment type is required" : null,
    },
  });

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: categories } = useSheetTransactionCategoriesQuery(
    sheetId,
    form.values.type,
  );
  const { data: paymentTypes } = useSheetPaymentTypesQuery(sheetId);
  const mutation = useCreateSheetTransactionMutation(sheetId);


  const handleSubmit = form.onSubmit(async (values) => {
    if (!session) return;

    await mutation.mutateAsync({
      sheetId,
      createdBy: session.user.id,
      amount: Number(values.amount),
      type: values.type,
      date: [
        values.date!.getFullYear(),
        String(values.date!.getMonth() + 1).padStart(2, '0'),
        String(values.date!.getDate()).padStart(2, '0'),
      ].join('-'),
      categoryId: values.categoryId!,
      paymentTypeId: values.paymentTypeId,
      description: values.description.trim() || null,
    });

    navigate({ to: "/sheets/$sheetId", params: { sheetId } });
  });

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Add Transaction" />

      <form onSubmit={handleSubmit}>
        <Stack gap="md" p="md">
          <SegmentedControl
            fullWidth
            value={form.values.type}
            onChange={(v) => {
              form.setValues({
                type: v as "expense" | "income",
                categoryId: null,
                paymentTypeId: null,
              });
            }}
            data={[
              { label: "Expense", value: "expense" },
              { label: "Income", value: "income" },
            ]}
            color="teal"
          />

          <CategoryCombobox
            label="Category"
            categories={categories ?? []}
            value={form.values.categoryId}
            onChange={(val) => {
              const selected = categories?.find((c) => c.id === val)
              form.setValues({
                categoryId: val,
                ...(selected?.defaultAmount != null && { amount: selected.defaultAmount }),
              })
            }}
            error={form.errors.categoryId}
          />

          <NumberInput
            label="Amount"
            placeholder="0.00"
            min={0.01}
            decimalScale={2}
            inputMode="decimal"
            {...form.getInputProps("amount")}
          />

          <DateInput
            label="Date"
            valueFormat="MMMM D, YYYY"
            firstDayOfWeek={0}
            {...form.getInputProps("date")}
          />

          {form.values.type === "expense" && (
            <IconCombobox
              label="Payment type"
              placeholder="Select a payment type"
              items={paymentTypes ?? []}
              value={form.values.paymentTypeId}
              onChange={(val) => form.setFieldValue("paymentTypeId", val)}
              error={form.errors.paymentTypeId}
            />
          )}

          <Textarea
            label="Description"
            placeholder="Optional note"
            autosize
            minRows={2}
            {...form.getInputProps("description")}
          />

          {mutation.isError && (
            <Text c="red" size="sm">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Failed to save. Try again."}
            </Text>
          )}

          <Group grow mt="xs">
            <Button
              variant="default"
              onClick={() => {
                if (history.length > 1) {
                  history.back();
                } else {
                  navigate({ to: "/sheets/$sheetId", params: { sheetId } });
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" color="teal" loading={mutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
