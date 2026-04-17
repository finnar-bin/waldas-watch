import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { ChevronRight, Plus } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCategoriesQuery } from "@/queries/use-sheet-categories-query";
import { useState } from "react";
import { formatCurrency } from "@/utils/format-currency";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/categories/",
)({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: currency } = useSheetCurrencyQuery(sheetId);
  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: categories = [] } = useSheetCategoriesQuery(sheetId);

  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Categories" />
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
                to: "/sheets/$sheetId/settings/categories/new",
                params: { sheetId },
              })
            }
          >
            Add
          </Button>
        }
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

        {filtered.length === 0 ? (
          <Box py="xl" ta="center">
            <Text size="sm" c="dimmed" mb="md">
              No {activeTab} categories yet.
            </Text>
            <Button
              size="sm"
              color="teal"
              leftSection={<Plus size={14} />}
              onClick={() =>
                navigate({
                  to: "/sheets/$sheetId/settings/categories/new",
                  params: { sheetId },
                })
              }
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
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate({
                    to: "/sheets/$sheetId/settings/categories/$categoryId",
                    params: { sheetId, categoryId: item.id },
                  })
                }
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
                    <Text size="sm" fw={600} truncate>
                      {item.name}
                    </Text>
                    {item.budget != null && (
                      <Text size="xs" c="dimmed">
                        Budget: {formatCurrency(item.budget, currency)}
                      </Text>
                    )}
                  </div>
                </Group>
                <ChevronRight
                  size={16}
                  strokeWidth={4}
                  color="var(--mantine-color-gray-5)"
                />
              </Group>
            ))}
          </Paper>
        )}
      </Box>
    </Box>
  );
}
