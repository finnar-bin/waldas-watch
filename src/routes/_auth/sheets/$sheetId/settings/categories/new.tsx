import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import {
  Box,
  Button,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { IconPickerGrid } from "@/components/IconPickerGrid";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useCreateCategoryMutation } from "@/queries/use-create-category-mutation";
import { ICONS } from "@/lib/constants/icons";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/categories/new",
)({
  component: NewCategoryPage,
});

interface FormValues {
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: number | "";
  defaultAmount: number | "";
}

function NewCategoryPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const createMutation = useCreateCategoryMutation(sheetId);

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      icon: ICONS[0],
      type: "expense",
      budget: "",
      defaultAmount: "",
    },
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
        type: values.type,
        budget: values.budget === "" ? null : Number(values.budget),
        defaultAmount:
          values.defaultAmount === "" ? null : Number(values.defaultAmount),
      },
      {
        onSuccess: () =>
          navigate({
            to: "/sheets/$sheetId/settings/categories",
            params: { sheetId },
          }),
      },
    );
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="New Category" />
      <BackLink
        to="/sheets/$sheetId/settings/categories"
        params={{ sheetId }}
        label="Categories"
      />
      <Box p="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Select
              label="Type"
              data={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
              allowDeselect={false}
              withAsterisk
              {...form.getInputProps("type")}
            />
            <TextInput
              label="Name"
              placeholder="e.g. Groceries, Salary"
              withAsterisk
              {...form.getInputProps("name")}
            />
            <IconPickerGrid
              label="Icon"
              icons={ICONS}
              value={form.values.icon}
              onChange={(icon) => form.setFieldValue("icon", icon)}
            />
            <NumberInput
              label="Budget"
              description="Monthly budget limit (optional)"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              {...form.getInputProps("budget")}
            />
            <NumberInput
              label="Default amount"
              description="Pre-fills the amount when adding a transaction (optional)"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              {...form.getInputProps("defaultAmount")}
            />
            <Button
              type="submit"
              color="teal"
              loading={createMutation.isPending}
              mt="xs"
            >
              Add category
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
