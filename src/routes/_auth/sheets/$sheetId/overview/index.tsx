import { createFileRoute, redirect } from "@tanstack/react-router";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export const Route = createFileRoute("/_auth/sheets/$sheetId/overview/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/sheets/$sheetId/overview/categories",
      params: { sheetId: params.sheetId },
      search: {
        year: currentYear,
        month: currentMonth,
        type: "expense" as const,
      },
    });
  },
  component: () => null,
});
