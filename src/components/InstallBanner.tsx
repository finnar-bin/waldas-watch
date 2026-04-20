import { ActionIcon, Alert, Group, Text } from "@mantine/core";
import { Download, Share, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallBanner() {
  const [state, dismiss] = useInstallPrompt();

  if (state.status === "ready") {
    return (
      <Alert
        icon={<Download size={16} />}
        color="teal"
        variant="filled"
        radius={0}
        style={{ position: "sticky", top: 0, zIndex: 998 }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm">
            Install Gastos for quick access from your home screen.
          </Text>
          <Group gap="xs" wrap="nowrap">
            <Text
              size="sm"
              fw={600}
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() =>
                state.prompt().then((outcome) => {
                  if (outcome === "accepted") dismiss();
                })
              }
            >
              Install
            </Text>
            <ActionIcon
              variant="filled"
              color="teal"
              size="sm"
              onClick={dismiss}
              aria-label="Dismiss"
            >
              <X size={14} />
            </ActionIcon>
          </Group>
        </Group>
      </Alert>
    );
  }

  if (state.status === "ios") {
    return (
      <Alert
        icon={<Share size={16} />}
        color="teal"
        variant="filled"
        radius={0}
        style={{ position: "sticky", top: 0, zIndex: 998 }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm">Tap Share then "Add to Home Screen" to install.</Text>
          <ActionIcon
            variant="filled"
            color="teal"
            size="sm"
            onClick={dismiss}
            aria-label="Dismiss"
          >
            <X size={14} />
          </ActionIcon>
        </Group>
      </Alert>
    );
  }

  return null;
}
