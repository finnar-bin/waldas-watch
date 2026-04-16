import { Link } from "@tanstack/react-router";
import { Box, Flex, Text, UnstyledButton } from "@mantine/core";
import { Home, LayoutDashboard, Plus, Settings } from "lucide-react";

interface NavItemProps {
  to: string;
  params: { sheetId: string };
  icon: React.ElementType;
  label: string;
  exactSearch?: boolean;
}

function NavItem({
  to,
  params,
  icon: Icon,
  label,
  exactSearch = true,
}: NavItemProps) {
  return (
    <Link
      to={to}
      params={params}
      activeOptions={{ exact: true, includeSearch: exactSearch }}
      style={{
        textDecoration: "none",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {({ isActive }) => (
        <UnstyledButton
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            width: "100%",
          }}
        >
          <Icon
            size={22}
            color={
              isActive
                ? "var(--mantine-color-teal-7)"
                : "var(--mantine-color-gray-6)"
            }
            strokeWidth={isActive ? 2.5 : 1.75}
          />
          <Text
            size="xs"
            fw={isActive ? 600 : 400}
            c={isActive ? "teal.7" : "gray.6"}
          >
            {label}
          </Text>
        </UnstyledButton>
      )}
    </Link>
  );
}

function AddButton({ sheetId }: { sheetId: string }) {
  return (
    <Link
      to="/sheets/$sheetId/transaction-form"
      params={{ sheetId }}
      style={{
        textDecoration: "none",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <UnstyledButton
        w={44}
        h={44}
        style={{
          background: "var(--mantine-color-teal-7)",
          borderRadius: "var(--mantine-radius-lg)",
          boxShadow: "0 4px 12px rgba(15, 118, 110, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Plus size={22} color="white" strokeWidth={2.5} />
      </UnstyledButton>
    </Link>
  );
}

interface BottomNavProps {
  sheetId: string;
}

export function BottomNav({ sheetId }: BottomNavProps) {
  const params = { sheetId };

  return (
    <Box
      h="100%"
      style={{
        borderTop: "1px solid var(--mantine-color-gray-1)",
        background: "var(--mantine-color-white)",
      }}
    >
      <Flex h="100%" align="center" px="md">
        <NavItem
          to="/sheets/$sheetId/"
          params={params}
          icon={Home}
          label="Home"
        />
        <NavItem
          to="/sheets/$sheetId/dashboard"
          params={params}
          icon={LayoutDashboard}
          label="Dashboard"
          exactSearch={false}
        />
        <NavItem
          to="/sheets/$sheetId/settings"
          params={params}
          icon={Settings}
          label="Settings"
        />
        <AddButton sheetId={sheetId} />
      </Flex>
    </Box>
  );
}
