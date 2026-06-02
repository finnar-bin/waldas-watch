import { useEffect } from "react";
import { useForm } from "@mantine/form";
import {
  Accordion,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { NotebookPen, Save } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMonthlySheetNoteQuery } from "@/queries/use-monthly-sheet-note-query";
import { useUpsertMonthlySheetNoteMutation } from "@/queries/use-upsert-monthly-sheet-note-mutation";

interface MonthlySheetNoteProps {
  sheetId: string;
  year: number;
  month: number;
  userId: string | undefined;
  canEdit: boolean;
}

interface FormValues {
  note: string;
}

export function MonthlySheetNote({
  sheetId,
  year,
  month,
  userId,
  canEdit,
}: MonthlySheetNoteProps) {
  const isOnline = useOnlineStatus();
  const { data, isLoading, isError } = useMonthlySheetNoteQuery(
    sheetId,
    year,
    month,
    userId,
  );
  const upsertMutation = useUpsertMonthlySheetNoteMutation(
    sheetId,
    year,
    month,
    userId,
  );

  const form = useForm<FormValues>({
    initialValues: { note: "" },
  });

  useEffect(() => {
    form.setValues({ note: data?.note ?? "" });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, data?.note, sheetId, year, month]);

  function handleSubmit(values: FormValues) {
    if (!userId) return;

    upsertMutation.mutate(
      {
        sheetId,
        year,
        month,
        note: values.note,
        createdBy: userId,
      },
      {
        onSuccess: () => form.resetDirty(),
      },
    );
  }

  const hasNote = form.values.note.trim().length > 0;
  const helperCopy = canEdit
    ? isOnline
      ? "Jot the month's budget tea, sweldo plans, or tiny pera reminders."
      : "Offline muna. You can read cached notes, but saving waits for internet."
    : "Read-only notes for this month's budget chika.";
  const errorCopy = isOnline
    ? "Notes are not available yet. The database migration may still need to run."
    : "Notes hit a snag. Reconnect, then try again.";

  return (
    <Paper radius="lg" shadow="sm" p={0}>
      <Accordion variant="contained" radius="lg">
        <Accordion.Item value="monthly-note">
          <Accordion.Control icon={<NotebookPen size={18} />}>
            <Group gap="xs" justify="space-between" pr="sm">
              <Text size="sm" fw={700}>
                Monthly notes
              </Text>
              {isLoading && <Loader size="xs" color="teal" />}
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="sm">
                <Text size="xs" c="dimmed">
                  {helperCopy}
                </Text>
                <Textarea
                  aria-label="Monthly notes"
                  placeholder="No notes yet. Lagay mo na yung budget tea."
                  minRows={4}
                  autosize
                  disabled={
                    !canEdit ||
                    !isOnline ||
                    isLoading ||
                    upsertMutation.isPending
                  }
                  {...form.getInputProps("note")}
                />
                {(isError || upsertMutation.isError) && (
                  <Text size="sm" c="red">
                    {errorCopy}
                  </Text>
                )}
                {!canEdit && !hasNote && (
                  <Text size="sm" c="dimmed">
                    No notes yet. The monthly chika is still quiet.
                  </Text>
                )}
                {canEdit && (
                  <Button
                    type="submit"
                    color="teal"
                    loading={upsertMutation.isPending}
                    disabled={
                      !userId || !isOnline || isLoading || !form.isDirty()
                    }
                    leftSection={<Save size={16} />}
                  >
                    Save note
                  </Button>
                )}
              </Stack>
            </form>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}
