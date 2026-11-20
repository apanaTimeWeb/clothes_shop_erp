import { beforeEach, describe, it, expect, vi, afterEach } from "vitest";
import { useAdminWorkspaceNavigation } from "@/app/frontend_admin/admin_workspace/workspace_navigation/state/AdminWorkspaceNavigationStore";
import { createSeed } from "@/app/frontend_admin/admin_workspace/workspace_navigation/mocks/AdminWorkspaceNavigationSeed";
import { STORAGE_KEY } from "@/app/frontend_admin/admin_workspace/workspace_navigation/state/AdminWorkspaceNavigationTransactions";
beforeEach(() => {
  localStorage.clear();
  useAdminWorkspaceNavigation.setState({
    state: createSeed(),
    ready: false,
    stale: false,
    notice: "",
  });
  useAdminWorkspaceNavigation.getState().hydrate();
});
afterEach(() => vi.restoreAllMocks());
describe("persist-before-publish host", () => {
  it("does not publish a mutation when browser persistence fails", () => {
    const before = useAdminWorkspaceNavigation.getState().state;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    expect(
      useAdminWorkspaceNavigation.getState().dispatch({ type: "session-new" }),
    ).toBe(false);
    expect(useAdminWorkspaceNavigation.getState().state).toBe(before);
    expect(useAdminWorkspaceNavigation.getState().notice).toContain(
      "Nothing was committed",
    );
  });
  it("rejects a stale tab before overwriting another tab’s update", () => {
    const other = createSeed();
    other.revision = 99;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(other));
    expect(
      useAdminWorkspaceNavigation.getState().dispatch({ type: "session-new" }),
    ).toBe(false);
    expect(useAdminWorkspaceNavigation.getState().stale).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).revision).toBe(99);
  });
});
