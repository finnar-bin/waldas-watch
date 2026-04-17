import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Avatar,
  Box,
  Center,
  Divider,
  Group,
  Loader,
  Paper,
  Progress,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { ChevronLeft } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";
import { useCategoryTransactionsQuery } from "@/queries/use-category-transactions-query";
import { useCategoryQuery } from "@/queries/use-category-query";
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

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/overview/$categoryId/",
)({
  validateSearch: (search: Record<string, unknown>) => ({
    year: typeof search.year === "number" ? search.year : currentYear,
    month: typeof search.month === "number" ? search.month : currentMonth,
    type:
      search.type === "income" ? "income" : ("expense" as "expense" | "income"),
  }),
  component: CategoryTransactionsPage,
});

function CategoryTransactionsPage() {
  const { sheetId, categoryId } = Route.useParams();
  const { year, month, type } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { session } = useSession();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: currency } = useSheetCurrencyQuery(sheetId);
  const { data: category } = useCategoryQuery(categoryId);
  const { data: transactions, isLoading } = useCategoryTransactionsQuery(
    sheetId,
    categoryId,
    year,
    month,
  );

  const budget = category?.budget ?? null;
  const totalAmount = useMemo(
    () => transactions?.reduce((sum: number, tx) => sum + tx.amount, 0) ?? 0,
    [transactions],
  );
  const budgetPct = budget != null ? (totalAmount / budget) * 100 : null;
  const isOverBudget = budgetPct != null && budgetPct > 100;
  const isNearBudget = budgetPct != null && budgetPct >= 85 && !isOverBudget;
  const barColor =
    budget != null
      ? isOverBudget
        ? "red"
        : isNearBudget
          ? "orange"
          : "teal"
      : "teal";

  function setYear(y: number) {
    navigate({ search: (prev) => ({ ...prev, year: y }) });
  }

  function setMonth(m: number) {
    navigate({ search: (prev) => ({ ...prev, month: m }) });
  }

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle={category?.name ?? "…"} />

      <Link
        to="/sheets/$sheetId/overview"
        params={() => ({ sheetId })}
        search={{ year, month, type }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          textDecoration: "none",
          color: "var(--mantine-color-teal-6)",
          fontWeight: 500,
          fontSize: "var(--mantine-font-size-sm)",
          paddingInline: "var(--mantine-spacing-md)",
        }}
      >
        <ChevronLeft size={14} />
        Overview
      </Link>

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

        <Paper radius="lg" p="sm" shadow="sm" style={{ border: "none" }}>
          <Group justify="space-between" mb={budget != null ? 8 : 0}>
            <Text size="lg" fw={600}>
              Total
            </Text>
            <Stack gap={0} align="flex-end">
              <Text size="md" fw={700}>
                {formatCurrency(totalAmount, currency)}
              </Text>
              {budget != null && (
                <Text size="xs" c="dimmed">
                  of {formatCurrency(budget, currency)}
                </Text>
              )}
            </Stack>
          </Group>
          {budget != null && (
            <>
              <Progress
                value={Math.min(budgetPct!, 100)}
                color={barColor}
                size="sm"
              />
              {(isOverBudget || isNearBudget) && (
                <Text
                  size="xs"
                  c={isOverBudget ? "red" : "orange"}
                  fw={600}
                  mt={4}
                >
                  {isOverBudget ? "Over budget" : "Almost at budget"}
                </Text>
              )}
            </>
          )}
        </Paper>

        {isLoading && (
          <Center py="xl">
            <Loader color="teal" />
          </Center>
        )}

        {!isLoading && transactions?.length === 0 && (
          <Center py="xl">
            <Text c="dimmed" size="sm">
              No transactions for this period.
            </Text>
          </Center>
        )}

        {transactions?.map((tx) => {
          const date = new Date(tx.date + "T00:00:00");
          const monthAbbr = MONTH_ABBR[date.getMonth()];
          const day = date.getDate();
          const creatorInitials = (
            tx.creatorDisplayName ??
            tx.creatorEmail ??
            "?"
          )
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <Paper
              key={tx.id}
              radius="lg"
              p="sm"
              shadow="sm"
              style={{ border: "none", cursor: "pointer" }}
              onClick={() =>
                navigate({
                  to: "/sheets/$sheetId/overview/$categoryId/edit",
                  params: { sheetId, categoryId },
                  search: { transactionId: tx.id, year, month, type },
                })
              }
            >
              <Group align="center" gap="sm" wrap="nowrap">
                <Stack
                  align="center"
                  justify="center"
                  gap={0}
                  style={{ minWidth: 32 }}
                >
                  <Text size="sm" c="dimmed" lh={1.2}>
                    {monthAbbr}
                  </Text>
                  <Text size="xl" fw={700} lh={1.1}>
                    {day}
                  </Text>
                </Stack>

                <Divider orientation="vertical" />

                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} lineClamp={2}>
                    {tx.description ?? category?.name}
                  </Text>
                  {tx.paymentTypeName && (
                    <Group gap={4} align="center">
                      <Box style={{ display: "flex", alignItems: "center" }}>
                        <TransactionCategoryIcon
                          icon={tx.paymentTypeIcon}
                          size={12}
                          color="var(--mantine-color-dimmed)"
                        />
                      </Box>
                      <Text size="xs" c="dimmed">
                        {tx.paymentTypeName}
                      </Text>
                    </Group>
                  )}
                  <Group gap={4} mt={2}>
                    <Avatar
                      src={tx.creatorAvatarUrl}
                      size={16}
                      radius="xl"
                      color="teal"
                    >
                      {creatorInitials}
                    </Avatar>
                    <Text size="xs" c="dimmed" truncate>
                      {tx.creatorDisplayName ?? tx.creatorEmail ?? "Unknown"}
                    </Text>
                  </Group>
                </Stack>

                <Text size="md" fw={700} style={{ whiteSpace: "nowrap" }}>
                  {formatCurrency(tx.amount, currency)}
                </Text>
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
