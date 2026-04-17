import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { IconPickerGrid } from "@/components/IconPickerGrid";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCategoriesQuery } from "@/queries/use-sheet-categories-query";
import { useCreateCategoryMutation } from "@/queries/use-create-category-mutation";
import { useUpdateCategoryMutation } from "@/queries/use-update-category-mutation";
import { useDeleteCategoryMutation } from "@/queries/use-delete-category-mutation";
import { CATEGORY_ICONS } from "@/lib/constants/icons";
import type { CategoryItem } from "@/lib/categories-requests";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/categories",
)({
  component: CategoriesPage,
});

interface FormValues {
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: number | "";
  defaultAmount: number | "";
}

function CategoriesPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: categories = [] } = useSheetCategoriesQuery(sheetId);

  const createMutation = useCreateCategoryMutation(sheetId);
  const updateMutation = useUpdateCategoryMutation(sheetId);
  const deleteMutation = useDeleteCategoryMutation(sheetId);

  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");
  const [formOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState<CategoryItem | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      icon: CATEGORY_ICONS[0],
      type: activeTab,
      budget: "",
      defaultAmount: "",
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Name is required" : null),
      icon: (v) => (v.length === 0 ? "Pick an icon" : null),
    },
  });

  function handleOpenAdd() {
    setEditing(null);
    form.setValues({
      name: "",
      icon: CATEGORY_ICONS[0],
      type: activeTab,
      budget: "",
      defaultAmount: "",
    });
    form.resetDirty();
    openForm();
  }

  function handleOpenEdit(item: CategoryItem) {
    setEditing(item);
    form.setValues({
      name: item.name,
      icon: item.icon,
      type: item.type,
      budget: item.budget ?? "",
      defaultAmount: item.defaultAmount ?? "",
    });
    form.resetDirty();
    openForm();
  }

  function handleOpenDelete(item: CategoryItem) {
    setDeleting(item);
    openDelete();
  }

  function handleSubmit(values: FormValues) {
    const budget = values.budget === "" ? null : Number(values.budget);
    const defaultAmount =
      values.defaultAmount === "" ? null : Number(values.defaultAmount);

    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          input: {
            name: values.name.trim(),
            icon: values.icon,
            budget,
            defaultAmount,
          },
        },
        { onSuccess: closeForm },
      );
    } else {
      createMutation.mutate(
        {
          sheetId,
          createdBy: session!.user.id,
          name: values.name.trim(),
          icon: values.icon,
          type: values.type,
          budget,
          defaultAmount,
        },
        { onSuccess: closeForm },
      );
    }
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: closeDelete });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <>
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={
          <Text size="lg" fw={700}>
            {editing ? "Edit category" : "Add category"}
          </Text>
        }
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Name"
              placeholder="e.g. Groceries, Salary"
              withAsterisk
              {...form.getInputProps("name")}
            />
            <IconPickerGrid
              label="Icon"
              icons={CATEGORY_ICONS}
              value={form.values.icon}
              onChange={(icon) => form.setFieldValue("icon", icon)}
            />
            <Select
              label="Type"
              data={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
              allowDeselect={false}
              disabled={!!editing}
              withAsterisk
              {...form.getInputProps("type")}
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
            <Group grow mt="xs">
              <Button variant="default" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" color="teal" loading={isPending}>
                {editing ? "Save" : "Add"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title={
          <Text size="lg" fw={700}>
            Delete category
          </Text>
        }
        centered
      >
        <Text size="sm">
          Delete{" "}
          <Text component="span" fw={600}>
            {deleting?.name}
          </Text>
          ? This will permanently delete the category and all associated data.
        </Text>
        <Group grow mt="lg">
          <Button variant="default" onClick={closeDelete}>
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
        <SheetHeader sheetName={sheetName} pageTitle="Categories" />
        <BackLink
          to="/sheets/$sheetId/settings"
          params={{ sheetId }}
          label="Settings"
        />
        <Box p="md">
          <SegmentedControl
            fullWidth
            mb="md"
            value={activeTab}
            onChange={(v) => setActiveTab(v as "income" | "expense")}
            data={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
            color="teal"
          />

          <Group justify="flex-end" mb="md">
            <Button
              size="xs"
              color="teal"
              leftSection={<Plus size={14} />}
              onClick={handleOpenAdd}
            >
              Add
            </Button>
          </Group>

          {filtered.length === 0 ? (
            <Box py="xl" ta="center">
              <Text size="sm" c="dimmed" mb="md">
                No {activeTab} categories yet.
              </Text>
              <Button
                size="sm"
                color="teal"
                leftSection={<Plus size={14} />}
                onClick={handleOpenAdd}
              >
                Add one
              </Button>
            </Box>
          ) : (
            <Paper radius="lg" shadow="sm" style={{ overflow: "hidden" }}>
              {filtered.map((item, index) => (
                <Group
                  key={item.id}
                  px="md"
                  py="sm"
                  justify="space-between"
                  style={{
                    borderBottom:
                      index < filtered.length - 1
                        ? "1px solid var(--mantine-color-gray-1)"
                        : undefined,
                    minHeight: 56,
                  }}
                >
                  <Group gap="sm">
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={item.type === "income" ? "teal" : "red"}
                      variant="light"
                    >
                      <TransactionCategoryIcon icon={item.icon} size={16} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={500}>
                        {item.name}
                      </Text>
                      {item.budget != null && (
                        <Text size="xs" c="dimmed">
                          Budget: {item.budget}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Group gap={4}>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleOpenDelete(item)}
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Paper>
          )}
        </Box>
      </Box>
    </>
  );
}
