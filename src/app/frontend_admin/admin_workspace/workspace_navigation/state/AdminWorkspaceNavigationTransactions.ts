import seed from "@/app/frontend_admin/admin_workspace/workspace_navigation/mocks/AdminWorkspaceNavigationFixture.json";
import type {
  AdminWorkspaceNavigationState,
  AdminWorkspaceNavigationAction,
  Payload,
  ActionType,
} from "@/app/frontend_admin/admin_workspace/workspace_navigation/types/AdminWorkspaceNavigationTypes";
import { demoSchema } from "@/app/frontend_admin/admin_workspace/workspace_navigation/schemas/AdminWorkspaceNavigationSnapshotSchema";
import {
  ensure,
  quantity,
  uid,
} from "@/app/frontend_admin/admin_workspace/workspace_navigation/utils/AdminWorkspaceNavigationAmounts";

export function createPresentationSeed(): AdminWorkspaceNavigationState {
  return structuredClone(seed) as AdminWorkspaceNavigationState;
}

export const variantFor = (state: AdminWorkspaceNavigationState, id: string) =>
  state.variants.find((v) => v.id === id)!;

export const sellable = (
  state: AdminWorkspaceNavigationState,
  variantId: string,
  locationId?: string,
) =>
  state.inventoryBalances
    .filter(
      (b) =>
        b.variantId === variantId &&
        (!locationId || b.locationId === locationId),
    )
    .reduce((sum, b) => sum + b.onHand - b.nonSellable, 0);

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminWorkspaceNavigationState,
  action: AdminWorkspaceNavigationAction,
  at = new Date().toISOString(),
): AdminWorkspaceNavigationState {
  if (!(["session-new", "reset"] as readonly string[]).includes(action.type))
    throw new Error("This action does not belong to this capability.");
  const next =
    action.type === "reset"
      ? createPresentationSeed()
      : structuredClone(previous);
  const payload: Payload = {
    sessionId: "",
    variantId: "",
    locationId: "",
    pickId: "",
    billId: "",
    qty: "",
    quantities: [],
    discountPaise: 0,
    taxPercent: 0,
    payment: "Cash",
    ...action.data,
  };
  if (/^(session-|shortlist-|pick-|picks-)/.test(action.type))
    sessionAction(next, action.type, payload, at);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function allocate(
  state: AdminWorkspaceNavigationState,
  variantId: string,
  input: unknown,
) {
  let qty = quantity(input);
  ensure(
    sellable(state, variantId) >= qty,
    "Not enough sellable stock. Refresh the selection.",
  );
  const result = [];
  for (const b of state.inventoryBalances.filter(
    (item) => item.variantId === variantId,
  )) {
    const take = Math.min(qty, b.onHand - b.nonSellable);
    if (take > 0) {
      result.push({ locationId: b.locationId, qty: take });
      qty -= take;
    }
    if (!qty) break;
  }
  return result;
}

export function sessionAction(
  state: AdminWorkspaceNavigationState,
  type: ActionType,
  data: Payload,
  at: string,
) {
  if (type === "session-new") {
    const id = uid("session");
    state.sessions.push({
      id,
      name: `Guest ${String(state.sessions.length + 1).padStart(2, "0")}`,
      status: "open",
      at,
    });
    state.activeSessionId = id;
    return;
  }
  const session = state.sessions.find(
    (s) => s.id === (data.sessionId || state.activeSessionId),
  );
  ensure(
    session && session.status === "open",
    "Start or choose an open customer session first.",
  );
  if (type === "session-switch") {
    state.activeSessionId = session.id;
    return;
  }
  const items = state.pickItems.filter((p) => p.sessionId === session.id);
  if (type === "session-close") {
    ensure(
      !items.some((p) => ["retrieved", "return-pending"].includes(p.status)),
      "Return or sell every retrieved item before closing this session.",
    );
    ensure(
      !state.draftBills.some(
        (d) => d.sessionId === session.id && d.status === "draft",
      ),
      "Abandon or complete this session’s bill first.",
    );
    items
      .filter((p) => p.status === "awaiting")
      .forEach((p) => (p.status = "cancelled"));
    session.status = "closed";
    state.activeSessionId = null;
    return;
  }
  if (type === "shortlist-add") {
    const qty = quantity(data.qty);
    const v = variantFor(state, data.variantId);
    ensure(
      v &&
        v.status === "active" &&
        state.products.find((p) => p.id === v.productId)?.status === "active",
      "This SKU is unavailable.",
    );
    const existing = state.shortlistItems.find(
      (i) =>
        i.sessionId === session.id &&
        i.variantId === v.id &&
        i.status === "shortlisted",
    );
    ensure(
      sellable(state, v.id) >= qty + (existing?.qty || 0),
      "The shortlist exceeds current availability.",
    );
    if (existing) existing.qty += qty;
    else
      state.shortlistItems.push({
        id: uid("shortlist"),
        sessionId: session.id,
        variantId: v.id,
        qty,
        status: "shortlisted",
      });
    return;
  }
  if (type === "shortlist-update") {
    const line = state.shortlistItems.find(
      (i) =>
        i.sessionId === session.id &&
        i.variantId === data.variantId &&
        i.status === "shortlisted",
    );
    ensure(line, "Shortlist item not found.");
    if (data.qty === 0)
      state.shortlistItems = state.shortlistItems.filter((i) => i !== line);
    else {
      const qty = quantity(data.qty);
      ensure(
        sellable(state, line.variantId) >= qty,
        "Quantity exceeds availability.",
      );
      line.qty = qty;
    }
    return;
  }
  if (type === "shortlist-clear") {
    state.shortlistItems = state.shortlistItems.filter(
      (i) => i.sessionId !== session.id || i.status !== "shortlisted",
    );
    return;
  }
  if (type === "picks-generate") {
    const lines = state.shortlistItems.filter(
      (i) => i.sessionId === session.id && i.status === "shortlisted",
    );
    ensure(lines.length, "Add a SKU to the shortlist first.");
    for (const line of lines) {
      for (const allocation of allocate(state, line.variantId, line.qty))
        state.pickItems.push({
          id: uid("pick"),
          sessionId: session.id,
          variantId: line.variantId,
          ...allocation,
          status: "awaiting",
        });
      line.status = "planned";
    }
    return;
  }
  const pick = items.find((p) => p.id === data.pickId);
  ensure(pick, "Pick line not found in this session.");
  ensure(
    !state.draftBills.some(
      (d) => d.status === "draft" && d.lines.some((l) => l.pickId === pick.id),
    ),
    "This item is in a draft. Abandon the draft before changing its handling.",
  );
  if (type === "pick-source") {
    ensure(
      pick.status === "awaiting",
      "Source can change before retrieval only.",
    );
    ensure(
      state.locations.some((l) => l.id === data.locationId && l.active) &&
        sellable(state, pick.variantId, data.locationId) >= pick.qty,
      "Insufficient stock at that source.",
    );
    pick.locationId = data.locationId;
    return;
  }
  if (type === "pick-retrieve") {
    ensure(pick.status === "awaiting", "This pick has already been handled.");
    ensure(
      sellable(state, pick.variantId, pick.locationId) >= pick.qty,
      "Source stock changed. Choose another source.",
    );
    pick.status = "retrieved";
    pick.retrievedAt = at;
    return;
  }
  if (type === "pick-reject") {
    ensure(
      pick.status === "retrieved",
      "Retrieve the item before rejecting it.",
    );
    pick.status = "return-pending";
    state.returnToBoxTasks.push({
      id: uid("return-task"),
      pickId: pick.id,
      sessionId: session.id,
      locationId: pick.locationId,
      qty: pick.qty,
      status: "pending",
      at,
    });
    return;
  }
  if (type === "pick-return") {
    ensure(
      pick.status === "return-pending",
      "This return was already handled or is not pending.",
    );
    pick.status = "returned";
    state.returnToBoxTasks
      .filter((t) => t.pickId === pick.id && t.status === "pending")
      .forEach((t) => {
        t.status = "returned";
        t.returnedAt = at;
      });
    return;
  }
  if (type === "pick-missing") {
    ensure(
      pick.status === "awaiting",
      "Only awaiting items can be marked not found.",
    );
    pick.status = "not-found";
    return;
  }
  throw new Error("Unknown session action.");
}
