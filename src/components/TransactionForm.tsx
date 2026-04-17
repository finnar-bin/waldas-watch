import type { UseFormReturnType } from "@mantine/form";
import { NumberInput, SegmentedControl, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { IconCombobox } from "@/components/IconCombobox";
import type {
  TransactionCategoryOption,
  PaymentTypeOption,
} from "@/lib/transaction-form-requests";

export interface FormValues {
  type: "expense" | "income";
  categoryId: string | null;
  paymentTypeId: string | null;
  amount: number | string;
  date: Date | null;
  description: string;
}

interface TransactionFormProps {
  form: UseFormReturnType<FormValues>;
  categories: TransactionCategoryOption[];
  paymentTypes: PaymentTypeOption[];
  showTypeToggle?: boolean;
  disabled?: boolean;
}

export function TransactionForm({
  form,
  categories,
  paymentTypes,
  showTypeToggle = true,
  disabled = false,
}: TransactionFormProps) {
  return (
    <>
      {showTypeToggle && (
        <SegmentedControl
          fullWidth
          disabled={disabled}
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
      )}

      <CategoryCombobox
        label="Category"
        categories={categories}
        value={form.values.categoryId}
        disabled={disabled}
        onChange={(val) => {
          const selected = categories.find((c) => c.id === val);
          form.setValues({
            categoryId: val,
            ...(selected?.defaultAmount != null && {
              amount: selected.defaultAmount,
            }),
          });
        }}
        error={form.errors.categoryId}
      />

      <NumberInput
        label="Amount"
        placeholder="0.00"
        min={0.01}
        decimalScale={2}
        inputMode="decimal"
        disabled={disabled}
        {...form.getInputProps("amount")}
      />

      <DateInput
        label="Date"
        valueFormat="MMMM D, YYYY"
        firstDayOfWeek={0}
        disabled={disabled}
        {...form.getInputProps("date")}
      />

      {form.values.type === "expense" && (
        <IconCombobox
          label="Payment type"
          placeholder="Select a payment type"
          items={paymentTypes}
          value={form.values.paymentTypeId}
          disabled={disabled}
          onChange={(val) => form.setFieldValue("paymentTypeId", val)}
          error={form.errors.paymentTypeId}
        />
      )}

      <Textarea
        label="Description"
        placeholder="Optional note"
        rows={3}
        disabled={disabled}
        {...form.getInputProps("description")}
      />
    </>
  );
}
