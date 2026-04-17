import { useEffect, useRef } from "react";
import {
  ActionIcon,
  ScrollArea,
  SimpleGrid,
  Stack,
  InputLabel,
} from "@mantine/core";
import { TransactionCategoryIcon } from "@/components/TransactionCategoryIcon";

interface IconPickerGridProps {
  label?: string;
  icons: readonly string[];
  value: string | null;
  onChange: (icon: string) => void;
}

export function IconPickerGrid({
  label,
  icons,
  value,
  onChange,
}: IconPickerGridProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "instant",
    });
  }, [value]);

  return (
    <Stack gap={4}>
      {label && <InputLabel>{label}</InputLabel>}
      <ScrollArea h={152} type="auto">
        <SimpleGrid cols={8} spacing={4} pr={4}>
          {icons.map((icon) => {
            const isActive = value === icon;
            return (
              <ActionIcon
                key={icon}
                ref={isActive ? activeRef : undefined}
                variant={isActive ? "filled" : "subtle"}
                color={isActive ? "teal" : "gray"}
                size="lg"
                onClick={() => onChange(icon)}
                aria-label={icon}
              >
                <TransactionCategoryIcon icon={icon} size={18} />
              </ActionIcon>
            );
          })}
        </SimpleGrid>
      </ScrollArea>
    </Stack>
  );
}
