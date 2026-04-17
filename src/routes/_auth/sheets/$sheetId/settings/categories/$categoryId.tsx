import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import {
  Box,
  Button,
  Center,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { IconPickerGrid } from "@/components/IconPickerGrid";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCategoriesQuery } from "@/queries/use-sheet-categories-query";
import { useUpdateCategoryMutation } from "@/queries/use-update-category-mutation";
import { ICONS } from "@/lib/constants/icons";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/categories/$categoryId",
)({
  component: EditCategoryPage,
});

interface FormValues {
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: number | "";
  defaultAmount: number | "";
}

function EditCategoryPage() {
  const { sheetId, categoryId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: categories = [], isLoading } = useSheetCategoriesQuery(sheetId);
  const category = categories.find((c) => c.id === categoryId);

  const updateMutation = useUpdateCategoryMutation(sheetId);

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

  useEffect(() => {
    if (!category) return;
    form.setValues({
      name: category.name,
      icon: category.icon,
      type: category.type,
      budget: category.budget ?? "",
      defaultAmount: category.defaultAmount ?? "",
    });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id]);

  function handleSubmit(values: FormValues) {
    updateMutation.mutate(
      {
        id: categoryId,
        input: {
          name: values.name.trim(),
          icon: values.icon,
          budget: values.budget === "" ? null : Number(values.budget),
          defaultAmount:
            values.defaultAmount === "" ? null : Number(values.defaultAmount),
        },
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

  const backLink = (
    <BackLink
      to="/sheets/$sheetId/settings/categories"
      params={{ sheetId }}
      label="Categories"
    />
  );

  if (isLoading) {
    return (
      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Edit Category" />
        {backLink}
        <Center py="xl">
          <Loader color="teal" />
        </Center>
      </Box>
    );
  }

  if (!category) {
    return (
      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Edit Category" />
        {backLink}
        <Box p="md">
          <Text c="dimmed" size="sm">
            Category not found.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Edit Category" />
      {backLink}
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
              loading={updateMutation.isPending}
              disabled={!form.isDirty()}
              mt="xs"
            >
              Save changes
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
