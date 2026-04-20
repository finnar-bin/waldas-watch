import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Drawer,
  Group,
  Indicator,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { Search, SlidersHorizontal } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { OverviewTabs } from "@/components/OverviewTabs";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { PaymentTypeCombobox } from "@/components/PaymentTypeCombobox";
import { CreatorCombobox } from "@/components/CreatorCombobox";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetCurrencyQuery } from "@/queries/use-sheet-currency-query";
import { useInfiniteSheetTransactionsQuery } from "@/queries/use-infinite-sheet-transactions-query";
import { SheetTransaction } from "@/lib/transactions-requests";
import { formatCurrency } from "@/utils/format-currency";
import { getInitials } from "@/lib/get-initials";

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

const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ListItem =
  | { kind: "header"; label: string; key: string }
  | { kind: "transaction"; tx: SheetTransaction; key: string }
  | { kind: "sentinel"; key: string };

function parseLocalDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/overview/transactions",
)({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    from: typeof search.from === "string" ? search.from : "",
    to: typeof search.to === "string" ? search.to : "",
    categoryId: typeof search.categoryId === "string" ? search.categoryId : "",
    paymentTypeId:
      typeof search.paymentTypeId === "string" ? search.paymentTypeId : "",
    creatorId: typeof search.creatorId === "string" ? search.creatorId : "",
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { sheetId } = Route.useParams();
  const { q, from, to, categoryId, paymentTypeId, creatorId } =
    Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { session } = useSession();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";
  const { data: currency } = useSheetCurrencyQuery(sheetId);

  const [searchInput, setSearchInput] = useState(q);
  const [filtersOpened, { open: openFilters, close: closeFilters }] =
    useDisclosure(false);

  // Draft filter state — synced from URL when drawer opens
  const [draftFrom, setDraftFrom] = useState<Date | null>(null);
  const [draftTo, setDraftTo] = useState<Date | null>(null);
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null);
  const [draftPaymentTypeId, setDraftPaymentTypeId] = useState<string | null>(
    null,
  );
  const [draftCreatorId, setDraftCreatorId] = useState<string | null>(null);

  useEffect(() => {
    if (filtersOpened) {
      setDraftFrom(parseLocalDate(from));
      setDraftTo(parseLocalDate(to));
      setDraftCategoryId(categoryId || null);
      setDraftPaymentTypeId(paymentTypeId || null);
      setDraftCreatorId(creatorId || null);
    }
  }, [filtersOpened]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, q: searchInput }) });
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = [
    from,
    to,
    categoryId,
    paymentTypeId,
    creatorId,
  ].filter(Boolean).length;

  const filters = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      categoryId: categoryId || undefined,
      paymentTypeId: paymentTypeId || undefined,
      creatorId: creatorId || undefined,
    }),
    [from, to, categoryId, paymentTypeId, creatorId],
  );

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteSheetTransactionsQuery(sheetId, q, filters);

  const allTransactions = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let lastMonthKey = "";
    for (const tx of allTransactions) {
      const date = new Date(tx.date + "T00:00:00");
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthKey !== lastMonthKey) {
        items.push({
          kind: "header",
          label: `${MONTH_FULL[date.getMonth()]} ${date.getFullYear()}`,
          key: `header-${monthKey}`,
        });
        lastMonthKey = monthKey;
      }
      items.push({ kind: "transaction", tx, key: tx.id });
    }
    if (hasNextPage) items.push({ kind: "sentinel", key: "sentinel" });
    return items;
  }, [allTransactions, hasNextPage]);

  const listRef = useRef<HTMLDivElement>(null);
  const virtualizer = useWindowVirtualizer({
    count: listItems.length,
    estimateSize: (i) => (listItems[i]?.kind === "header" ? 36 : 88),
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (
      listItems[last.index]?.kind === "sentinel" &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, listItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

  function applyFilters() {
    navigate({
      search: (prev) => ({
        ...prev,
        from: formatDate(draftFrom),
        to: formatDate(draftTo),
        categoryId: draftCategoryId ?? "",
        paymentTypeId: draftPaymentTypeId ?? "",
        creatorId: draftCreatorId ?? "",
      }),
    });
    closeFilters();
  }

  function clearFilters() {
    setDraftFrom(null);
    setDraftTo(null);
    setDraftCategoryId(null);
    setDraftPaymentTypeId(null);
    setDraftCreatorId(null);
    navigate({
      search: (prev) => ({
        ...prev,
        from: "",
        to: "",
        categoryId: "",
        paymentTypeId: "",
        creatorId: "",
      }),
    });
    closeFilters();
  }

  return (
    <>
      <Drawer
        opened={filtersOpened}
        onClose={closeFilters}
        position="bottom"
        size="auto"
        title="Filters"
        styles={{
          content: {
            borderTopLeftRadius: "var(--mantine-radius-md)",
            borderTopRightRadius: "var(--mantine-radius-md)",
            height: "auto",
          },
        }}
      >
        <Stack gap="md" pb="md">
          <Group grow>
            <DateInput
              label="From"
              placeholder="Start date"
              value={draftFrom}
              onChange={setDraftFrom}
              clearable
              maxDate={draftTo ?? undefined}
            />
            <DateInput
              label="To"
              placeholder="End date"
              value={draftTo}
              onChange={setDraftTo}
              clearable
              minDate={draftFrom ?? undefined}
            />
          </Group>
          <CategoryCombobox
            sheetId={sheetId}
            label="Category"
            value={draftCategoryId}
            onChange={(val) => setDraftCategoryId(val)}
          />
          <PaymentTypeCombobox
            sheetId={sheetId}
            label="Payment type"
            placeholder="All payment types"
            value={draftPaymentTypeId}
            onChange={setDraftPaymentTypeId}
          />
          <CreatorCombobox
            sheetId={sheetId}
            label="Creator"
            value={draftCreatorId}
            onChange={setDraftCreatorId}
          />
          <Button color="teal" onClick={applyFilters}>
            Apply filters
          </Button>
          <Button variant="default" onClick={clearFilters}>
            Clear filters
          </Button>
        </Stack>
      </Drawer>

      <Box pb="md">
        <SheetHeader sheetName={sheetName} pageTitle="Overview" />

        <Stack gap="md" px="md" pb="md">
          <OverviewTabs sheetId={sheetId} />

          <Group gap="xs" align="center">
            <TextInput
              flex={1}
              placeholder="Search transactions..."
              leftSection={<Search size={16} />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              autoComplete="off"
            />
            <Indicator
              label={activeFilterCount}
              disabled={activeFilterCount === 0}
              size={16}
              color="teal"
            >
              <ActionIcon
                variant={activeFilterCount > 0 ? "filled" : "default"}
                color={activeFilterCount > 0 ? "teal" : undefined}
                size="input-sm"
                onClick={openFilters}
                aria-label="Filters"
              >
                <SlidersHorizontal size={16} />
              </ActionIcon>
            </Indicator>
          </Group>

          {isLoading && (
            <Center py="xl">
              <Loader color="teal" />
            </Center>
          )}

          {!isLoading && allTransactions.length === 0 && (
            <Center py="xl">
              <Text c="dimmed" size="sm">
                No transactions found.
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
                const item = listItems[virtualItem.index];
                const wrapperStyle = {
                  position: "absolute" as const,
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                };

                if (item.kind === "sentinel") {
                  return (
                    <div
                      key={item.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      style={wrapperStyle}
                    >
                      <Center py="sm">
                        <Loader color="teal" size="sm" />
                      </Center>
                    </div>
                  );
                }

                if (item.kind === "header") {
                  return (
                    <div
                      key={item.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      style={wrapperStyle}
                    >
                      <Text
                        size="xs"
                        fw={700}
                        c="dimmed"
                        tt="uppercase"
                        pb="xs"
                        pt={virtualItem.index === 0 ? 0 : "xs"}
                      >
                        {item.label}
                      </Text>
                    </div>
                  );
                }

                const { tx } = item;
                const date = new Date(tx.date + "T00:00:00");
                const monthAbbr = MONTH_ABBR[date.getMonth()];
                const day = date.getDate();
                const creatorInitials = getInitials(
                  tx.creatorName,
                  tx.creatorEmail,
                );

                return (
                  <div
                    key={item.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{ ...wrapperStyle, paddingBottom: 12 }}
                  >
                    <Paper
                      radius="lg"
                      p="sm"
                      shadow="sm"
                      style={{
                        border: "none",
                        cursor: tx.categoryId ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (!tx.categoryId) return;
                        navigate({
                          to: "/sheets/$sheetId/overview/categories/$categoryId/edit",
                          params: { sheetId, categoryId: tx.categoryId },
                          search: { transactionId: tx.id },
                        });
                      }}
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
                            {tx.description || tx.categoryName}
                          </Text>
                          {tx.categoryName && (
                            <Group gap={4} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                              <Box style={{ flexShrink: 0, display: "flex" }}>
                                <TransactionCategoryIcon
                                  icon={tx.categoryIcon}
                                  size={12}
                                  color="var(--mantine-color-dimmed)"
                                />
                              </Box>
                              <Text size="xs" c="dimmed" truncate>
                                {tx.categoryName}
                              </Text>
                            </Group>
                          )}
                          {tx.paymentTypeName && (
                            <Group gap={4} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                              <Box style={{ flexShrink: 0, display: "flex" }}>
                                <TransactionCategoryIcon
                                  icon={tx.paymentTypeIcon}
                                  size={12}
                                  color="var(--mantine-color-dimmed)"
                                />
                              </Box>
                              <Text size="xs" c="dimmed" truncate>
                                {tx.paymentTypeName}
                              </Text>
                            </Group>
                          )}
                          <Group gap={4} mt={2}>
                            <Avatar
                              src={tx.creatorAvatarUrl ?? undefined}
                              size={16}
                              radius="xl"
                              color="teal"
                            >
                              {creatorInitials}
                            </Avatar>
                            <Text size="xs" c="dimmed" truncate>
                              {tx.creatorName ?? tx.creatorEmail ?? "Unknown"}
                            </Text>
                          </Group>
                        </Stack>

                        <Text
                          size="md"
                          fw={700}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {formatCurrency(tx.amount, currency)}
                        </Text>
                      </Group>
                    </Paper>
                  </div>
                );
              })}
            </div>
          </div>
        </Stack>
      </Box>
    </>
  );
}
