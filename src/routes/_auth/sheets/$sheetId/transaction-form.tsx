import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { SheetHeader } from "@/components/SheetHeader";
import { TransactionForm, FormValues } from "@/components/TransactionForm";
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

function TransactionFormPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

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
        String(values.date!.getMonth() + 1).padStart(2, "0"),
        String(values.date!.getDate()).padStart(2, "0"),
      ].join("-"),
      categoryId: values.categoryId!,
      paymentTypeId: values.paymentTypeId,
      description: values.description.trim() || null,
    });

    navigate({ to: "/sheets/$sheetId", params: { sheetId } });
  });

  function handleCancel() {
    if (history.length > 1) {
      history.back();
    } else {
      navigate({ to: "/sheets/$sheetId", params: { sheetId } });
    }
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Add Transaction" />
      <form onSubmit={handleSubmit}>
        <Stack gap="md" p="md">
          <TransactionForm
            form={form}
            categories={categories ?? []}
            paymentTypes={paymentTypes ?? []}
            disabled={mutation.isPending}
          />
          {mutation.isError && (
            <Text c="red" size="sm">
              {mutation.error?.message ?? "Something went wrong."}
            </Text>
          )}
          <Group grow mt="xs">
            <Button variant="default" onClick={handleCancel} disabled={mutation.isPending}>
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
