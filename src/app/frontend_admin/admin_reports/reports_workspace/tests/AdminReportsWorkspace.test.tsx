import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import axe from "axe-core";
import { AdminReportsWorkspaceMain } from "@/app/frontend_admin/admin_reports/reports_workspace/components/AdminReportsWorkspaceMain";
import messages from "@/app/frontend_admin/admin_reports/reports_workspace/locales/admin_reports_workspace_en.json";
import { useAdminReportsWorkspace } from "@/app/frontend_admin/admin_reports/reports_workspace/state/AdminReportsWorkspaceStore";
import { createPresentationSeed } from "@/app/frontend_admin/admin_reports/reports_workspace/state/AdminReportsWorkspaceTransactions";
import { downloadText } from "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDownload";
vi.mock(
  "@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDownload",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/app/frontend_admin/admin_reports/reports_workspace/utils/AdminReportsWorkspaceDownload")
    >()),
    downloadText: vi.fn(),
  }),
);
beforeEach(() => {
  useAdminReportsWorkspace.setState({
    state: createPresentationSeed(),
    ready: true,
    stale: false,
    mode: "Staff",
  });
  vi.clearAllMocks();
});
afterEach(cleanup);
function mount() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ reports: messages }}>
      <AdminReportsWorkspaceMain />
    </NextIntlClientProvider>,
  );
}
describe("Reports screen", () => {
  it("exports real rows while omitting profit in Staff mode", () => {
    mount();
    expect(
      screen.queryByText("Estimated gross profit"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Export sales CSV" }));
    const [, csv] = vi.mocked(downloadText).mock.calls[0];
    expect(csv).toContain("Everyday Cotton Polo");
    expect(csv).not.toContain("profit");
  });
  it("displays Admin profit and updates date-range empty state", () => {
    useAdminReportsWorkspace.setState({ mode: "Admin" });
    mount();
    expect(
      screen.getByRole("columnheader", { name: "Estimated gross profit" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("From", { exact: true }), {
      target: { value: "2099-01-01" },
    });
    expect(
      screen.getByText(/No completed sales or refunds/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Through"), {
      target: { value: "2098-01-01" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("From no later");
  });
  it("exports filtered current stock without changing state", () => {
    mount();
    const before = useAdminReportsWorkspace.getState().state;
    fireEvent.change(screen.getByLabelText("Location", { exact: true }), {
      target: { value: "loc-5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Export stock CSV" }));
    const [, csv] = vi.mocked(downloadText).mock.calls[0];
    expect(csv).toContain("Rack B / Shelf 1 / Box 5");
    expect(csv).not.toContain("Rack A / Shelf 1 / Box 1");
    expect(useAdminReportsWorkspace.getState().state).toBe(before);
  });
  it("keeps table headers and labels accessible in automated DOM checks", async () => {
    const { container } = mount();
    expect(
      within(
        screen.getByRole("table", { name: "Sales breakdown" }),
      ).getAllByRole("columnheader"),
    ).toHaveLength(6);
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
