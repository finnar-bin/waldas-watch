import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { PenSquare, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  QuickActionKey,
  FinancialAssistantResponse,
  StarterInsight,
} from "@/lib/ai-assistant-requests";
import { useFinancialAssistantMutation } from "@/queries/use-financial-assistant-mutation";
import { useFinancialAssistantStarterInsightsQuery } from "@/queries/use-financial-assistant-starter-insights-query";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  scope?: FinancialAssistantResponse["scope"];
  disclaimer?: string | null;
}

interface QuickAction {
  key: QuickActionKey;
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "budget_risk",
    label: "Why am I over budget?",
    prompt: "Why am I over budget this month?",
  },
  {
    key: "top_categories",
    label: "Biggest expenses",
    prompt: "What are my biggest expenses this month?",
  },
  {
    key: "spending_trend",
    label: "Monthly trends",
    prompt: "Show my spending trend this month versus recent months.",
  },
  {
    key: "payday_forecast",
    label: "Compare months",
    prompt: "Compare this month and last month spending by category.",
  },
  {
    key: "recurring_audit",
    label: "Subscriptions",
    prompt:
      "Review my recurring subscription expenses and tell me what to trim from my budget.",
  },
];

const FALLBACK_STARTER_INSIGHTS: StarterInsight[] = [
  {
    id: "over_budget",
    title: "Check this month's budget",
    body: "See whether your current spending pace still fits your plan.",
    actionLabel: "Review budget",
    actionPrompt: "Explain why I am over budget this month.",
  },
  {
    id: "spending_trends",
    title: "Review monthly trends",
    body: "Compare recent months and spot categories that are moving up.",
    actionLabel: "Analyze",
    actionPrompt: "Show my spending trend this month versus recent months.",
  },
  {
    id: "recurring",
    title: "Review recurring charges",
    body: "Look for subscriptions and repeat expenses that may be worth trimming.",
    actionLabel: "Review",
    actionPrompt:
      "Review recurring subscription expenses and suggest what to keep or cut from my budget.",
  },
];

const LOADING_MESSAGES = [
  "Sifting through your gastos...",
  "Checking where the money went...",
  "Comparing this month with the last one...",
  "Spotting sneaky budget leaks...",
  "Balancing the numbers like a pro...",
  "Looking for the usual pera troublemakers...",
  "Crunching the spending receipts...",
  "Putting the budget puzzle together...",
];

function WaldiMessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <Text size="sm" mb={6}>
            {children}
          </Text>
        ),
        strong: ({ children }) => (
          <Text component="span" fw={700}>
            {children}
          </Text>
        ),
        ul: ({ children }) => (
          <Stack component="ul" gap={4} pl="md" my={0}>
            {children}
          </Stack>
        ),
        ol: ({ children }) => (
          <Stack component="ol" gap={4} pl="md" my={0}>
            {children}
          </Stack>
        ),
        li: ({ children }) => (
          <Text component="li" size="sm">
            {children}
          </Text>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

interface FinancialAssistantDrawerProps {
  opened: boolean;
  onClose: () => void;
  sheetId: string;
}

export function FinancialAssistantDrawer({
  opened,
  onClose,
  sheetId,
}: FinancialAssistantDrawerProps) {
  const mutation = useFinancialAssistantMutation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationSummary, setConversationSummary] = useState<string | null>(
    null,
  );
  const [drawerMode, setDrawerMode] = useState<"partial" | "full" | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    prompt: string;
    promptType: "quick_action" | "free_text";
    quickActionKey?: QuickActionKey;
  } | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  const form = useForm({
    initialValues: {
      question: "",
    },
    validate: {
      question: (value) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) return "Ask a finance question first.";
        if (trimmed.length > 400)
          return "Keep your question under 400 characters.";
        return null;
      },
    },
  });

  const loadingMessage =
    LOADING_MESSAGES[messages.length % LOADING_MESSAGES.length] ??
    LOADING_MESSAGES[0];
  const hasActiveChat = messages.length > 0 || mutation.isPending;
  const resolvedDrawerMode = drawerMode ?? (hasActiveChat ? "full" : "partial");
  const starterInsightsQuery = useFinancialAssistantStarterInsightsQuery(
    sheetId,
    opened && messages.length === 0,
  );

  const suggestedFollowUps = useMemo(() => {
    if (!mutation.data?.suggestedFollowUps?.length) return [];
    return mutation.data.suggestedFollowUps.slice(0, 3);
  }, [mutation.data]);

  useEffect(() => {
    setMessages([]);
    setConversationSummary(null);
    setSystemError(null);
    setLastRequest(null);
    setDrawerMode(null);
    mutation.reset();
    touchStartY.current = null;
  }, [sheetId]);

  useEffect(() => {
    if (!opened || messages.length === 0) return;

    requestAnimationFrame(() => {
      const viewport = scrollViewportRef.current;
      if (!viewport) return;

      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [
    messages.length,
    mutation.isPending,
    opened,
    suggestedFollowUps.length,
  ]);

  async function sendPrompt(
    prompt: string,
    promptType: "quick_action" | "free_text",
    quickActionKey?: QuickActionKey,
  ) {
    if (mutation.isPending) return;

    const trimmed = prompt.trim();
    if (!trimmed) return;

    setSystemError(null);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const rollingMessages = messages
      .filter((message) => message.role === "user")
      .slice(-2)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((prev) => [...prev, userMessage]);
    setLastRequest({ prompt: trimmed, promptType, quickActionKey });

    try {
      const response = await mutation.mutateAsync({
        sheetId,
        message: trimmed,
        promptType,
        quickActionKey: quickActionKey ?? null,
        contextWindowMonths: 6,
        conversationMessages: rollingMessages,
        conversationSummary,
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        scope: response.scope,
        disclaimer: response.disclaimer,
      };
      setConversationSummary(response.conversationSummary ?? conversationSummary);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setSystemError("Couldn't analyze your finances right now.");
    }
  }

  function handleRetry() {
    if (!lastRequest || mutation.isPending) return;
    void sendPrompt(
      lastRequest.prompt,
      lastRequest.promptType,
      lastRequest.quickActionKey,
    );
  }

  function handleNewChat() {
    const shouldStayFullscreen = resolvedDrawerMode === "full";
    setMessages([]);
    setConversationSummary(null);
    setSystemError(null);
    setLastRequest(null);
    form.reset();
    setDrawerMode(shouldStayFullscreen ? "full" : null);
    mutation.reset();
    scrollViewportRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleClose() {
    setDrawerMode(null);
    touchStartY.current = null;
    onClose();
  }

  function handleDragStart(y: number) {
    touchStartY.current = y;
  }

  function handleDragEnd(y: number) {
    if (touchStartY.current === null) return;
    const delta = y - touchStartY.current;
    if (delta < -40) setDrawerMode("full");
    if (delta > 40) {
      if (resolvedDrawerMode === "full") {
        setDrawerMode("partial");
      } else {
        handleClose();
      }
    }
    touchStartY.current = null;
  }

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      position="bottom"
      size={resolvedDrawerMode === "full" ? "100dvh" : "75dvh"}
      transitionProps={{ transition: "slide-up", duration: 220 }}
      overlayProps={{ backgroundOpacity: 0.14, blur: 0 }}
      styles={{
        content: {
          borderTopLeftRadius:
            resolvedDrawerMode === "full" ? 0 : "var(--mantine-radius-xl)",
          borderTopRightRadius:
            resolvedDrawerMode === "full" ? 0 : "var(--mantine-radius-xl)",
          display: "flex",
          flexDirection: "column",
        },
        body: {
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          padding: 0,
        },
        header: {
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          paddingBottom: "var(--mantine-spacing-sm)",
          alignItems: "stretch",
        },
      }}
      title={
        <Stack gap={6} w="100%">
          {resolvedDrawerMode !== "full" && (
            <Box
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
              onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientY)}
              onMouseDown={(e) => handleDragStart(e.clientY)}
              onMouseUp={(e) => handleDragEnd(e.clientY)}
              style={{
                width: 42,
                height: 4,
                borderRadius: 999,
                background: "var(--mantine-color-gray-4)",
                alignSelf: "center",
                cursor: "ns-resize",
              }}
            />
          )}
          <Group justify="space-between" align="center" wrap="nowrap">
            <Box>
              <Text fw={700}>Ask Waldi</Text>
              <Text size="xs" c="dimmed">
                Your AI money buddy
              </Text>
            </Box>
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="New chat"
                onClick={handleNewChat}
              >
                <PenSquare size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Close assistant"
                onClick={handleClose}
              >
                <X size={16} />
              </ActionIcon>
            </Group>
          </Group>
          <Group gap="xs" wrap="wrap">
            {QUICK_ACTIONS.map((action) => (
              <UnstyledButton
                key={action.key}
                disabled={mutation.isPending}
                onClick={() =>
                  sendPrompt(action.prompt, "quick_action", action.key)
                }
                style={{
                  border: "1px solid var(--mantine-color-gray-3)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  background: "var(--mantine-color-gray-0)",
                  whiteSpace: "nowrap",
                  color: "var(--mantine-color-gray-8)",
                  fontSize: 12,
                  lineHeight: 1.2,
                  opacity: mutation.isPending ? 0.55 : 1,
                }}
              >
                {action.label}
              </UnstyledButton>
            ))}
          </Group>
        </Stack>
      }
    >
      <Stack h="100%" gap="sm" style={{ minHeight: 0, overflow: "hidden" }}>
        <ScrollArea
          flex={1}
          type="auto"
          style={{ minHeight: 0 }}
          viewportRef={scrollViewportRef}
        >
          <Stack gap="sm" px="md" py="md">
            {messages.length === 0 && (
              <Stack gap="sm">
                {starterInsightsQuery.isLoading &&
                  [0, 1, 2].map((index) => (
                    <Paper
                      key={index}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{ borderColor: "var(--mantine-color-green-2)" }}
                    >
                      <Stack gap="xs">
                        <Skeleton height={12} radius="xl" width="52%" />
                        <Skeleton height={10} radius="xl" />
                        <Skeleton height={10} radius="xl" width="68%" />
                      </Stack>
                    </Paper>
                  ))}
                {!starterInsightsQuery.isLoading &&
                  (starterInsightsQuery.data?.length
                    ? starterInsightsQuery.data
                    : FALLBACK_STARTER_INSIGHTS
                  ).map((insight) => (
                    <Paper
                      key={insight.id}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{
                        borderColor: "var(--mantine-color-teal-2)",
                        background: "var(--mantine-color-teal-0)",
                      }}
                    >
                      <Stack gap={4}>
                        <Text fw={700} size="sm" c="gray.9">
                          {insight.title}
                        </Text>
                        <Text size="sm" c="gray.7">
                          {insight.body}
                        </Text>
                        <Button
                          variant="subtle"
                          color="gray"
                          size="compact-sm"
                          leftSection={<Sparkles size={14} />}
                          onClick={() =>
                            sendPrompt(insight.actionPrompt, "quick_action")
                          }
                          style={{ alignSelf: "flex-start" }}
                        >
                          {insight.actionLabel}
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                {starterInsightsQuery.isError && (
                  <Paper
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      borderColor: "var(--mantine-color-yellow-4)",
                      background: "var(--mantine-color-yellow-0)",
                    }}
                  >
                    <Text size="sm" c="yellow.9">
                      Personalized cards are temporarily unavailable.
                    </Text>
                  </Paper>
                )}
              </Stack>
            )}

            {messages.map((message) => (
              <Paper
                key={message.id}
                p="sm"
                radius="md"
                withBorder
                style={
                  message.role === "user"
                    ? {
                        borderColor: "var(--mantine-color-teal-2)",
                        background: "var(--mantine-color-teal-0)",
                      }
                    : { borderColor: "var(--mantine-color-gray-3)" }
                }
              >
                <Stack gap={4}>
                  <Text
                    size="xs"
                    c={message.role === "user" ? "teal.8" : "dimmed"}
                    fw={700}
                  >
                    {message.role === "user" ? "You" : "Waldi insight"}
                  </Text>
                  {message.role === "assistant" ? (
                    <WaldiMessageContent content={message.content} />
                  ) : (
                    <Text size="sm">{message.content}</Text>
                  )}
                  {message.disclaimer && (
                    <Text size="xs" c="dimmed">
                      {message.disclaimer}
                    </Text>
                  )}
                </Stack>
              </Paper>
            ))}

            {systemError && (
              <Paper
                p="sm"
                radius="md"
                withBorder
                style={{
                  borderColor: "var(--mantine-color-yellow-4)",
                  background: "var(--mantine-color-yellow-0)",
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm" c="yellow.9">
                    Couldn&apos;t analyze your finances right now.
                  </Text>
                  <Button
                    size="compact-sm"
                    variant="light"
                    color="yellow"
                    onClick={handleRetry}
                  >
                    Retry
                  </Button>
                </Group>
              </Paper>
            )}

            {mutation.isPending && (
              <Paper
                p="sm"
                radius="md"
                withBorder
                style={{ borderColor: "var(--mantine-color-gray-3)" }}
              >
                <Stack gap="xs">
                  <Group gap="xs">
                    <Loader size="xs" color="gray" />
                    <Text size="sm" c="dimmed">
                      {loadingMessage}
                    </Text>
                  </Group>
                  <Skeleton height={10} radius="xl" />
                  <Skeleton height={10} radius="xl" width="72%" />
                </Stack>
              </Paper>
            )}

            {messages.length > 0 && suggestedFollowUps.length > 0 && (
              <Group gap="xs" wrap="wrap">
                {suggestedFollowUps.map((item) => (
                  <UnstyledButton
                    key={item}
                    disabled={mutation.isPending}
                    onClick={() => sendPrompt(item, "free_text")}
                    style={{
                      border: "1px solid var(--mantine-color-gray-3)",
                      borderRadius: 999,
                      padding: "5px 10px",
                      background: "var(--mantine-color-white)",
                      color: "var(--mantine-color-gray-7)",
                      fontSize: 12,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      opacity: mutation.isPending ? 0.55 : 1,
                    }}
                  >
                    {item}
                  </UnstyledButton>
                ))}
              </Group>
            )}
          </Stack>
        </ScrollArea>

        <Divider />

        <form
          style={{
            padding: "0 var(--mantine-spacing-md) var(--mantine-spacing-md)",
          }}
          onSubmit={form.onSubmit(async (values, event) => {
            event?.preventDefault();
            if (mutation.isPending) return;
            const prompt = values.question.trim();
            if (!prompt) return;
            form.setFieldValue("question", "");
            await sendPrompt(prompt, "free_text");
          })}
        >
          <Group align="center" wrap="nowrap">
            <Textarea
              flex={1}
              minRows={2}
              maxRows={2}
              placeholder="Can I still stay within my budget this month?"
              {...form.getInputProps("question")}
            />
            <ActionIcon
              type="submit"
              size={38}
              radius="xl"
              color="teal"
              variant="filled"
              disabled={mutation.isPending}
              loading={mutation.isPending}
            >
              <Send size={16} />
            </ActionIcon>
          </Group>
        </form>
      </Stack>
    </Drawer>
  );
}
