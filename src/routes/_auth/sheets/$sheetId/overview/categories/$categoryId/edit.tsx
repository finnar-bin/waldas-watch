import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { Trash2 } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { TransactionForm, FormValues } from "@/components/TransactionForm";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useTransactionQuery } from "@/queries/use-transaction-query";
import { useUpdateTransactionMutation } from "@/queries/use-update-transaction-mutation";
import { useDeleteTransactionMutation } from "@/queries/use-delete-transaction-mutation";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/overview/categories/$categoryId/edit",
)({
  validateSearch: (search: Record<string, unknown>) => ({
    transactionId:
      typeof search.transactionId === "string" ? search.transactionId : "",
  }),
  component: EditTransactionPage,
});

function EditTransactionPage() {
  const { sheetId, categoryId } = Route.useParams();
  const { transactionId } = Route.useSearch();
  const router = useRouter();
  const { session } = useSession();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: transaction, isLoading: isLoadingTransaction } =
    useTransactionQuery(transactionId);
  const mutation = useUpdateTransactionMutation(sheetId, categoryId);
  const deleteMutation = useDeleteTransactionMutation(sheetId, categoryId);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

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

  useEffect(() => {
    if (!transaction) return;
    const [y, m, d] = transaction.date.split("-").map(Number);
    form.setValues({
      type: transaction.type,
      categoryId: transaction.categoryId,
      paymentTypeId: transaction.paymentTypeId,
      amount: transaction.amount,
      date: new Date(y, m - 1, d),
      description: transaction.description ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const handleSubmit = form.onSubmit(async (values) => {
    await mutation.mutateAsync({
      transactionId,
      input: {
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
      },
    });

    router.history.back();
  });

  function handleCancel() {
    router.history.back();
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(transactionId);
    router.history.back();
  }

  if (isLoadingTransaction) {
    return (
      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Edit Transaction" />
        <Center py="xl">
          <Loader color="teal" />
        </Center>
      </Box>
    );
  }

  return (
    <>
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={
          <Text size="lg" fw={700}>
            Delete transaction
          </Text>
        }
        centered
      >
        <Text size="sm">
          Once it's gone, it's gone — no undo, no time machine, no take-backs.
          Are you absolutely sure you want to delete this transaction?
        </Text>
        <Group grow mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Group>
      </Modal>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Edit Transaction" />
        <Paper p="md" shadow="sm" radius="lg" m="md">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TransactionForm
                sheetId={sheetId}
                form={form}
                showTypeToggle={false}
                disabled={mutation.isPending || deleteMutation.isPending}
              />
              {mutation.isError && (
                <Text c="red" size="sm">
                  {mutation.error?.message ?? "Something went wrong."}
                </Text>
              )}
              <Stack gap="xs" mt="xs">
                <Button
                  type="submit"
                  color="teal"
                  loading={mutation.isPending}
                  disabled={deleteMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  variant="default"
                  onClick={handleCancel}
                  disabled={mutation.isPending || deleteMutation.isPending}
                >
                  Cancel
                </Button>
              </Stack>
              <Divider />
              <Button
                variant="outline"
                color="red"
                leftSection={<Trash2 size={16} />}
                onClick={openDeleteModal}
                disabled={mutation.isPending || deleteMutation.isPending}
              >
                Delete transaction
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </>
  );
}
