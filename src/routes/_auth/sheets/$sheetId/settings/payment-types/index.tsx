import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Button, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import { ChevronRight, Plus } from "lucide-react";
import { SheetHeader } from "@/components/SheetHeader";
import { BackLink } from "@/components/BackLink";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";
import { useSession } from "@/providers/SessionProvider";
import { useUserSheetsQuery } from "@/queries/use-user-sheets-query";
import { useSheetPaymentTypesQuery } from "@/queries/use-sheet-payment-types-query";

export const Route = createFileRoute(
  "/_auth/sheets/$sheetId/settings/payment-types/",
)({
  component: PaymentTypesPage,
});

function PaymentTypesPage() {
  const { sheetId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();

  const { data: sheets } = useUserSheetsQuery(session?.user.id);
  const sheetName = sheets?.find((s) => s.id === sheetId)?.name ?? "…";

  const { data: paymentTypes = [] } = useSheetPaymentTypesQuery(sheetId);

  return (
    <Box pb="md">
      <SheetHeader sheetName={sheetName} pageTitle="Payment Types" />
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
                to: "/sheets/$sheetId/settings/payment-types/new",
                params: { sheetId },
              })
            }
          >
            Add
          </Button>
        }
      />
      <Box p="md">
        {paymentTypes.length === 0 ? (
          <Box py="xl" ta="center">
            <Text size="sm" c="dimmed" mb="md">
              No payment types yet.
            </Text>
          </Box>
        ) : (
          <Paper radius="lg" shadow="sm" style={{ overflow: "hidden" }}>
            {paymentTypes.map((item, index) => (
              <Group
                key={item.id}
                px="md"
                py="sm"
                justify="space-between"
                style={{
                  borderBottom:
                    index < paymentTypes.length - 1
                      ? "1px solid var(--mantine-color-gray-1)"
                      : undefined,
                  minHeight: 56,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate({
                    to: "/sheets/$sheetId/settings/payment-types/$paymentTypeId",
                    params: { sheetId, paymentTypeId: item.id },
                  })
                }
              >
                <Group gap="sm">
                  <ThemeIcon size="md" radius="xl" color="teal" variant="light">
                    <TransactionCategoryIcon icon={item.icon} size={16} />
                  </ThemeIcon>
                  <Text size="sm" fw={600} truncate>
                    {item.name}
                  </Text>
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
