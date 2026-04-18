import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { ChevronRight, Plus } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetRecurringTransactionsQuery } from "@/queries/use-sheet-recurring-transactions-query";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/recurring-transactions/",
)({
  component: RecurringTransactionsPage,
});

function RecurringTransactionsPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: recurringList = [] } =
    useSheetRecurringTransactionsQuery(sheetId);

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Recurring" />
      <BackLink
        to="/sheets/$sheetId/settings"
        params={{ sheetId }}
        label="Settings"
        rightSection={
          <Button
            size="xs"
            color="teal"
            leftSection={<Plus size={14} />}
            onClick={() =>
              navigate({
                to: "/sheets/$sheetId/settings/recurring-transactions/new",
                params: { sheetId },
              })
            }
          >
            Add
          </Button>
        }
      />
      <Box p="md">
        {recurringList.length === 0 ? (
          <Box py="xl" ta="center">
            <Text size="sm" c="dimmed" mb="md">
              No recurring transactions yet.
            </Text>
          </Box>
        ) : (
          <Paper radius="lg" shadow="sm" style={{ overflow: "hidden" }}>
            {recurringList.map((item, index) => (
              <Group
                key={item.id}
                px="md"
                py="sm"
                justify="space-between"
                style={{
                  borderBottom:
                    index < recurringList.length - 1
                      ? "1px solid var(--mantine-color-gray-1)"
                      : undefined,
                  minHeight: 60,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate({
                    to: "/sheets/$sheetId/settings/recurring-transactions/$recurringId",
                    params: { sheetId, recurringId: item.id },
                  })
                }
              >
                <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                  <ThemeIcon
                    size="md"
                    radius="xl"
                    color={item.type === "income" ? "teal" : "red"}
                    variant="light"
                    style={{ flexShrink: 0 }}
                  >
                    <TransactionCategoryIcon
                      icon={item.categoryIcon}
                      size={16}
                    />
                  </ThemeIcon>
                  <div style={{ minWidth: 0 }}>
                    <Group gap={6} align="center">
                      <Text size="sm" fw={600} truncate>
                        {item.description || item.categoryName}
                      </Text>
                      {!item.isActive && (
                        <Badge size="xs" color="gray" variant="light">
                          Paused
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed" tt="capitalize">
                      {item.frequency}
                      {item.dayOfMonth != null
                        ? ` · day ${item.dayOfMonth}`
                        : ""}
                      {item.paymentTypeName ? ` · ${item.paymentTypeName}` : ""}
                    </Text>
                  </div>
                </Group>
                <Group gap={6} style={{ flexShrink: 0 }}>
                  <Text
                    size="sm"
                    fw={600}
                    c={item.type === "income" ? "teal.7" : "red.7"}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {item.amount.toFixed(2)}
                  </Text>
                  <ChevronRight
                    size={16}
                    strokeWidth={4}
                    color="var(--mantine-color-gray-5)"
                  />
                </Group>
              </Group>
            ))}
          </Paper>
        )}
      </Box>
    </Box>
  );
}
