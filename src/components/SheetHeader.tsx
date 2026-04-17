import { ActionIcon, Flex, Group, Text, Title } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { BookCopy, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-requests";

interface SheetHeaderProps {
  sheetName: string;
  pageTitle: string;
}

export function SheetHeader({ sheetName, pageTitle }: SheetHeaderProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <Flex align="center" justify="space-between" px="md" py="sm">
      <div style={{ minWidth: 0 }}>
        <Text
          size="xs"
          c="teal.9"
          fw={600}
          lh={1.2}
          style={{ textTransform: "uppercase", letterSpacing: "2px" }}
        >
          {sheetName}
        </Text>
        <Title order={3} fw={900} lh={1.3} truncate>
          {pageTitle}
        </Title>
      </div>
      <Group gap={4}>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={() => navigate({ to: "/sheets" })}
        >
          <BookCopy size={18} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut size={18} />
        </ActionIcon>
      </Group>
    </Flex>
  );
}
