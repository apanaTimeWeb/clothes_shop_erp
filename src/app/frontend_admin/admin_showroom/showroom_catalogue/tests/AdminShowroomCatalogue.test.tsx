import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { AdminShowroomCatalogueMain } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/components/AdminShowroomCatalogueMain";
import messages from "@/app/frontend_admin/admin_showroom/showroom_catalogue/locales/admin_showroom_catalogue_en.json";
import { useAdminShowroomCatalogue } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueStore";
import { createSeed } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/mocks/AdminShowroomCatalogueSeed";
import { sellable } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueTransactions";
vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img {...props} />
  ),
}));
function mount() {
  render(
    <NextIntlClientProvider locale="en" messages={{ showroom: messages }}>
      <AdminShowroomCatalogueMain />
    </NextIntlClientProvider>,
  );
}
beforeEach(() => {
  localStorage.clear();
  useAdminShowroomCatalogue.setState({
    state: createSeed(),
    ready: false,
    stale: false,
    notice: "",
    mode: "Staff",
  });
  useAdminShowroomCatalogue.getState().hydrate();
});
afterEach(cleanup);
describe("showroom behavior", () => {
  it("does not mark a whole design unavailable because one variant is sold out", () => {
    mount();
    const dress = screen.getByRole("button", {
      name: "View variants — Little Scarlet Dress",
    });
    expect(within(dress).queryByText("Out of stock")).not.toBeInTheDocument();
    expect(within(dress).getByText(/sellable units/)).toBeInTheDocument();
  });
  it("searches exact variant, opens details and adds to a session without stock change", async () => {
    useAdminShowroomCatalogue.getState().dispatch({ type: "session-new" });
    mount();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search the collection" }),
      { target: { value: "black cotton full sleeve collar tshirt XL" } },
    );
    await waitFor(() =>
      expect(
        screen.getByText("1 designs · 1 matching variants"),
      ).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "View variants — Everyday Cotton Polo",
      }),
    );
    expect(screen.getByRole("combobox", { name: "Colour" })).toHaveValue(
      "Black",
    );
    expect(screen.getByRole("combobox", { name: "Size" })).toHaveValue(
      "variant-1-0-3",
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to shortlist" }));
    await waitFor(() =>
      expect(
        useAdminShowroomCatalogue.getState().state.shortlistItems,
      ).toHaveLength(1),
    );
    expect(
      sellable(useAdminShowroomCatalogue.getState().state, "variant-1-0-3"),
    ).toBe(7);
  });
  it("shows category-specific facets and clears neck/sleeve when switching to socks", () => {
    mount();
    fireEvent.change(screen.getByRole("combobox", { name: "All categories" }), {
      target: { value: "T-shirt" },
    });
    expect(
      screen.getByRole("combobox", { name: "Sleeve" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Sleeve" }), {
      target: { value: "Full" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "All categories" }), {
      target: { value: "Socks" },
    });
    expect(
      screen.queryByRole("combobox", { name: "Sleeve" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("combobox", { name: "Size" })).queryByRole(
        "option",
        { name: "XL" },
      ),
    ).not.toBeInTheDocument();
  });
});
