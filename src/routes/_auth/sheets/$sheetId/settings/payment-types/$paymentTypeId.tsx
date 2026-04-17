import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
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
  TextInput,
} from "@mantine/core";
import { Trash2 } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { IconPickerGrid } from "@/components/IconPickerGrid";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetPaymentTypesQuery } from "@/queries/use-sheet-payment-types-query";
import { useUpdatePaymentTypeMutation } from "@/queries/use-update-payment-type-mutation";
import { useDeletePaymentTypeMutation } from "@/queries/use-delete-payment-type-mutation";
import { ICONS } from "@/lib/constants/icons";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/payment-types/$paymentTypeId",
)({
  component: EditPaymentTypePage,
});

interface FormValues {
  name: string;
  icon: string;
}

function EditPaymentTypePage() {
  const { sheetId, paymentTypeId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: paymentTypes = [], isLoading } =
    useSheetPaymentTypesQuery(sheetId);
  const paymentType = paymentTypes.find((p) => p.id === paymentTypeId);

  const updateMutation = useUpdatePaymentTypeMutation(sheetId);
  const deleteMutation = useDeletePaymentTypeMutation(sheetId);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  const form = useForm<FormValues>({
    initialValues: { name: "", icon: ICONS[0] },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Name is required" : null),
      icon: (v) => (v.length === 0 ? "Pick an icon" : null),
    },
  });

  useEffect(() => {
    if (!paymentType) return;
    form.setValues({ name: paymentType.name, icon: paymentType.icon });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType?.id]);

  async function handleDelete() {
    await deleteMutation.mutateAsync(paymentTypeId);
    navigate({
      to: "/sheets/$sheetId/settings/payment-types",
      params: { sheetId },
    });
  }

  function handleSubmit(values: FormValues) {
    updateMutation.mutate(
      {
        id: paymentTypeId,
        input: { name: values.name.trim(), icon: values.icon },
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

  const backLink = (
    <BackLink
      to="/sheets/$sheetId/settings/payment-types"
      params={{ sheetId }}
      label="Payment Types"
    />
  );

  if (isLoading) {
    return (
      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Edit Payment Type" />
        {backLink}
        <Center py="xl">
          <Loader color="teal" />
        </Center>
      </Box>
    );
  }

  if (!paymentType) {
    return (
      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Edit Payment Type" />
        {backLink}
        <Box p="md">
          <Text c="dimmed" size="sm">
            Payment type not found.
          </Text>
        </Box>
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
            Delete payment type
          </Text>
        }
        centered
      >
        <Text size="sm">
          Once it's gone, it's gone — existing transactions using this payment
          type will keep their data.
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
        <SheetHeader sheetName={sheetName} pageTitle="Edit Payment Type" />
        {backLink}
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
                loading={updateMutation.isPending}
                disabled={!form.isDirty() || deleteMutation.isPending}
                mt="xs"
              >
                Save changes
              </Button>
              <Divider />
              <Button
                variant="outline"
                color="red"
                leftSection={<Trash2 size={16} />}
                onClick={openDeleteModal}
                disabled={updateMutation.isPending || deleteMutation.isPending}
              >
                Delete payment type
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </>
  );
}
