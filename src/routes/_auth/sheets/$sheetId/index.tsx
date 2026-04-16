import { createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  Box,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { SheetHeader } from "@/components/SheetHeader";
import { useSession } from "@/providers/SessionProvider";
import { useCurrentMonthSheetCategoryTotalsQuery } from "@/queries/use-current-month-sheet-category-totals-query";
import { useCurrentMonthSheetTotalsQuery } from "@/queries/use-current-month-sheet-totals-query";
import { useRecentSheetTransactionsQuery } from "@/queries/use-recent-sheet-transactions-query";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate, formatMonthYear } from "@/utils/format-date";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";

export const Route = createFileRoute("/_auth/sheets/$sheetId/")({
  component: SheetHomePage,
});

function SheetHomePage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: totals, isLoading: totalsLoading } =
    useCurrentMonthSheetTotalsQuery(sheetId);
  const {
    data: recentTx,
    isLoading: txLoading,
    isError: txError,
    error: txRawError,
  } = useRecentSheetTransactionsQuery(sheetId);
  const { data: currency } = useSheetCurrencyQuery(sheetId);
  // loaded so query cache is primed; used by chart when implemented
  useCurrentMonthSheetCategoryTotalsQuery(sheetId);

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Home" />

      {/* Monthly summary card */}
      <Box
        p="xl"
        mx="md"
        my="md"
        style={{
          background:
            "linear-gradient(135deg, #05070F 0%, #0B1120 50%, #111D3A 100%)",
          borderRadius: "var(--mantine-radius-lg)",
          color: "white",
          boxShadow: "0 8px 32px rgba(5, 7, 15, 0.4)",
          position: "relative",
          overflow: "hidden",
          minHeight: 160,
        }}
      >
        {/* Decorative circles */}
        <Box
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            pointerEvents: "none",
            filter: "blur(32px)",
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: -70,
            right: 10,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            pointerEvents: "none",
            filter: "blur(48px)",
          }}
        />

        {totalsLoading ? (
          <Center py="xl">
            <Loader color="white" size="sm" />
          </Center>
        ) : (
          <Stack gap="lg" style={{ position: "relative" }}>
            <Group justify="space-between" align="center">
              <Text
                size="xs"
                fw={900}
                style={{
                  opacity: 0.7,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Monthly Snapshot
              </Text>
              <Text size="xs" style={{ opacity: 0.7 }}>
                {formatMonthYear(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                )}
              </Text>
            </Group>

            <Group grow>
              <Stack gap={4}>
                <Text size="xs" style={{ opacity: 0.7 }}>
                  Income
                </Text>
                <Text fw={700} size="xl" style={{ letterSpacing: "-0.02em" }}>
                  {formatCurrency(totals?.incomeTotal ?? 0, currency)}
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="xs" style={{ opacity: 0.7 }}>
                  Expenses
                </Text>
                <Text fw={700} size="xl" style={{ letterSpacing: "-0.02em" }}>
                  {formatCurrency(totals?.expenseTotal ?? 0, currency)}
                </Text>
              </Stack>
            </Group>
          </Stack>
        )}
      </Box>

      {/* Recent transactions */}
      <Box px="md" pt="sm">
        <Title order={4} fw={700} mb="sm">
          Recent transactions
        </Title>
      </Box>
      <Paper mx="md" radius="lg" shadow="sm">
        {txLoading && (
          <Center py="md">
            <Loader color="teal" size="sm" />
          </Center>
        )}
        {txError && (
          <Text c="red" size="sm" px="md" py="sm">
            {txRawError instanceof Error
              ? txRawError.message
              : "Failed to load transactions."}
          </Text>
        )}
        {!txLoading && !txError && (recentTx?.length ?? 0) === 0 && (
          <Text c="dimmed" size="sm" px="md" py="sm">
            No transactions yet.
          </Text>
        )}
        <Stack gap={0}>
          {recentTx?.map((tx) => (
            <Box
              key={tx.id}
              px="md"
              py="sm"
              style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}
            >
              <Box style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Box
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background:
                      tx.type === "income"
                        ? "var(--mantine-color-green-1)"
                        : "var(--mantine-color-red-1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TransactionCategoryIcon
                    icon={tx.categoryIcon}
                    size={18}
                    color={
                      tx.type === "income"
                        ? "var(--mantine-color-green-9)"
                        : "var(--mantine-color-red-8)"
                    }
                  />
                </Box>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {tx.description ?? tx.categoryName ?? "—"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(tx.date)}
                    {tx.categoryName && ` · ${tx.categoryName}`}
                  </Text>
                  {tx.creatorName && (
                    <Group gap={4} align="center">
                      <Avatar src={tx.creatorAvatarUrl} size={14} radius="xl">
                        {tx.creatorName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text size="xs" c="dimmed">
                        {tx.creatorName}
                      </Text>
                    </Group>
                  )}
                </Stack>
                <Text
                  size="sm"
                  fw={700}
                  c={tx.type === "income" ? "green.9" : "red.8"}
                  style={{ flexShrink: 0 }}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount, currency)}
                </Text>
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
