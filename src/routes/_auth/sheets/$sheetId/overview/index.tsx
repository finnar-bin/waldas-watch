import { useRef, useMemo } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Box,
  Center,
  Paper,
  Group,
  Loader,
  Progress,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { SheetHeader } from "@/components/SheetHeader";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";
import { useSession } from "@/providers/SessionProvider";
import { useSheetTransactionOverviewQuery } from "@/queries/use-sheet-transaction-overview-query";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { formatCurrency } from "@/utils/format-currency";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const YEARS = Array.from({ length: 11 }, (_, i) => {
  const y = currentYear - 5 + i;
  return { value: String(y), label: String(y) };
});

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const Route = createFileRoute("/_auth/sheets/$sheetId/overview/")({
  validateSearch: (search: Record<string, unknown>) => ({
    year: typeof search.year === "number" ? search.year : currentYear,
    month: typeof search.month === "number" ? search.month : currentMonth,
    type: search.type === "income" ? "income" : ("expense" as "expense" | "income"),
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { sheetId } = Route.useParams();
  const { year, month, type } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { session } = useSession();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: currency } = useSheetCurrencyQuery(sheetId);
  const { data: categories, isLoading } = useSheetTransactionOverviewQuery(
    sheetId,
    year,
    month,
    type,
  );

  const items = useMemo(() => {
    if (!categories) return [];
    const maxAmount = Math.max(...categories.map((c) => c.totalAmount), 1);
    return categories.map((cat) => {
      const budgetPct =
        cat.budget != null ? (cat.totalAmount / cat.budget) * 100 : null;
      const isOverBudget = budgetPct != null && budgetPct > 100;
      const isNearBudget =
        budgetPct != null && budgetPct >= 85 && !isOverBudget;
      const barValue =
        cat.budget != null
          ? Math.min(budgetPct!, 100)
          : (cat.totalAmount / maxAmount) * 100;
      const barColor =
        cat.budget != null
          ? isOverBudget
            ? "red"
            : isNearBudget
              ? "orange"
              : "teal"
          : "gray";
      return { cat, isOverBudget, isNearBudget, barValue, barColor };
    });
  }, [categories]);

  const listRef = useRef<HTMLDivElement>(null);
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 88,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  function setYear(y: number) {
    navigate({ search: (prev) => ({ ...prev, year: y }) });
  }

  function setMonth(m: number) {
    navigate({ search: (prev) => ({ ...prev, month: m }) });
  }

  function setType(t: "expense" | "income") {
    navigate({ search: (prev) => ({ ...prev, type: t }) });
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Overview" />

      <Stack gap="md" p="md">
        <Group grow>
          <Select
            data={MONTHS}
            value={String(month)}
            onChange={(v) => v && setMonth(Number(v))}
            size="sm"
            autoComplete="off"
          />
          <Select
            data={YEARS}
            value={String(year)}
            onChange={(v) => v && setYear(Number(v))}
            size="sm"
            autoComplete="off"
          />
        </Group>

        <SegmentedControl
          fullWidth
          value={type}
          onChange={(v) => setType(v as "expense" | "income")}
          data={[
            { label: "Expenses", value: "expense" },
            { label: "Income", value: "income" },
          ]}
          color="teal"
        />

        {isLoading && (
          <Center py="xl">
            <Loader color="teal" />
          </Center>
        )}

        {!isLoading && categories?.length === 0 && (
          <Center py="xl">
            <Text c="dimmed" size="sm">
              No data for this period.
            </Text>
          </Center>
        )}

        <div ref={listRef}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const { cat, isOverBudget, isNearBudget, barValue, barColor } =
                items[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    paddingBottom: 16,
                    transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                  }}
                >
                  <Link
                    to="/sheets/$sheetId/overview/$categoryId"
                    params={{ sheetId, categoryId: cat.categoryId }}
                    search={{ year, month, type }}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Paper radius="lg" p="sm" shadow="sm">
                      <Group justify="space-between" mb={8}>
                        <Group gap="xs">
                          <TransactionCategoryIcon
                            icon={cat.categoryIcon}
                            size={16}
                          />
                          <Text size="sm" fw={600}>
                            {cat.categoryName}
                          </Text>
                          {isOverBudget && (
                            <Text size="xs" c="red" fw={600}>
                              Over budget
                            </Text>
                          )}
                          {isNearBudget && (
                            <Text size="xs" c="orange" fw={600}>
                              Almost at budget
                            </Text>
                          )}
                        </Group>
                        <Stack gap={0} align="flex-end">
                          <Text size="sm" fw={700}>
                            {formatCurrency(cat.totalAmount, currency)}
                          </Text>
                          {cat.budget != null && (
                            <Text size="xs" c="dimmed">
                              of {formatCurrency(cat.budget, currency)}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                      <Progress value={barValue} color={barColor} size="sm" />
                    </Paper>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </Stack>
    </Box>
  );
}
