import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@mantine/form";
import {
  Box,
  Button,
  Flex,
  Paper,
  Select,
  Stack,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { BackLink } from "@/components/BackLink";
import { useCreateSheetMutation } from "@/queries/use-create-sheet-mutation";
import { useSession } from "@/providers/SessionProvider";
import { CURRENCIES } from "@/lib/constants/currencies";

export const Route = createFileRoute("/_auth/sheets/new")({
  component: NewSheetPage,
});

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} – ${c.name}`,
}));

interface FormValues {
  name: string;
  description: string;
  currency: string;
}

function NewSheetPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const createMutation = useCreateSheetMutation(session?.user.id);

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      description: "",
      currency: "PHP",
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Name is required" : null),
    },
  });

  function handleSubmit(values: FormValues) {
    createMutation.mutate(
      {
        name: values.name.trim(),
        description: values.description.trim() || null,
        currency: values.currency,
      },
      {
        onSuccess: (sheetId) =>
          navigate({ to: "/sheets/$sheetId", params: { sheetId } }),
      },
    );
  }

  return (
    <Box pb="md">
      <Flex align="center" px="md" py="sm">
        <Title order={3} fw={900} lh={1.3}>
          New Sheet
        </Title>
      </Flex>
      <BackLink to="/sheets" label="My Sheets" />
      <Paper p="md" shadow="sm" radius="lg" m="md" mt="xs">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Name"
              placeholder="e.g. Household expenses, Europe trip"
              {...form.getInputProps("name")}
            />
            <Textarea
              label="Description"
              placeholder="e.g. Tracking every coffee and questionable late-night purchase"
              rows={3}
              {...form.getInputProps("description")}
            />
            <Select
              label="Currency"
              data={CURRENCY_OPTIONS}
              searchable
              allowDeselect={false}
              {...form.getInputProps("currency")}
            />
            <Button
              type="submit"
              color="teal"
              loading={createMutation.isPending}
              mt="xs"
            >
              Create Sheet
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
