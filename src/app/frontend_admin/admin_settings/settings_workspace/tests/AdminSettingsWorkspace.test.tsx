import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import axe from "axe-core";
import { AdminSettingsWorkspaceMain } from "@/app/frontend_admin/admin_settings/settings_workspace/components/AdminSettingsWorkspaceMain";
import messages from "@/app/frontend_admin/admin_settings/settings_workspace/locales/admin_settings_workspace_en.json";
import { useAdminSettingsWorkspace } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceStore";
import { downloadText } from "@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceDownload";
import { parseDemoImport } from "@/app/frontend_admin/admin_settings/settings_workspace/state/AdminSettingsWorkspaceTransactions";
vi.mock(
  "@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceDownload",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/app/frontend_admin/admin_settings/settings_workspace/utils/AdminSettingsWorkspaceDownload")
    >()),
    downloadText: vi.fn(),
  }),
);
beforeEach(() => {
  localStorage.clear();
  useAdminSettingsWorkspace.setState({
    ready: false,
    stale: false,
    mode: "Admin",
    notice: "",
  });
  useAdminSettingsWorkspace.getState().hydrate();
  vi.clearAllMocks();
});
afterEach(cleanup);
function mount() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ settings: messages }}>
      <AdminSettingsWorkspaceMain />
    </NextIntlClientProvider>,
  );
}
describe("Settings and backup screen", () => {
  it("shows a display-mode boundary for Staff", () => {
    useAdminSettingsWorkspace.setState({ mode: "Staff" });
    mount();
    expect(
      screen.queryByRole("button", { name: "Export complete demo JSON" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Choose Admin preview/)).toBeInTheDocument();
  });
  it("saves threshold/name and preserves historical invoice snapshots", async () => {
    mount();
    const old = useAdminSettingsWorkspace.getState().state.sales;
    fireEvent.change(screen.getByLabelText("Shop display name"), {
      target: { value: "Sample Boutique" },
    });
    fireEvent.change(screen.getByLabelText("Low-stock threshold (units)"), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() =>
      expect(
        useAdminSettingsWorkspace.getState().state.settings.lowStockThreshold,
      ).toBe(9),
    );
    expect(useAdminSettingsWorkspace.getState().state.sales).toEqual(old);
  });
  it("exports a parseable complete backup", () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Export complete demo JSON" }),
    );
    const [, text] = vi.mocked(downloadText).mock.calls[0];
    expect(parseDemoImport(text)).toEqual(
      useAdminSettingsWorkspace.getState().state,
    );
  });
  it("rejects invalid upload inline and keeps current records", async () => {
    mount();
    const before = useAdminSettingsWorkspace.getState().state;
    const file = new File(["{bad"], "invalid.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", { value: async () => "{bad" });
    fireEvent.change(screen.getByLabelText("Choose demo JSON"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Import rejected"),
    );
    expect(useAdminSettingsWorkspace.getState().state).toBe(before);
    expect(
      screen.queryByRole("button", { name: "Replace demo with this file" }),
    ).not.toBeInTheDocument();
  });
  it("has labelled controls and passes DOM accessibility rules", async () => {
    const { container } = mount();
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
