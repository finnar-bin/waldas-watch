import { Tabs } from "@mantine/core";
import { useNavigate, useRouterState } from "@tanstack/react-router";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

interface OverviewTabsProps {
  sheetId: string;
}

export function OverviewTabs({ sheetId }: OverviewTabsProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const activeTab = pathname.includes("/transactions")
    ? "transactions"
    : "categories";

  function handleTabChange(value: string | null) {
    if (!value) return;
    if (value === "transactions") {
      navigate({
        to: "/sheets/$sheetId/overview/transactions",
        params: { sheetId },
        search: { q: "", from: "", to: "", categoryId: "", paymentTypeId: "", creatorId: "" },
      });
    } else {
      navigate({
        to: "/sheets/$sheetId/overview/categories",
        params: { sheetId },
        search: {
          year: currentYear,
          month: currentMonth,
          type: "expense" as const,
        },
      });
    }
  }

  return (
    <Tabs value={activeTab} onChange={handleTabChange} color="green">
      <Tabs.List grow>
        <Tabs.Tab
          value="categories"
          style={{
            fontWeight: 600,
            color: activeTab === "categories" ? "green" : "inherit",
          }}
        >
          Categories
        </Tabs.Tab>
        <Tabs.Tab
          value="transactions"
          style={{
            fontWeight: 600,
            color: activeTab === "transactions" ? "green" : "inherit",
          }}
        >
          Transactions
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}
