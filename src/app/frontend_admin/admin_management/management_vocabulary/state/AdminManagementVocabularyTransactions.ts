import seed from "@/app/frontend_admin/admin_management/management_vocabulary/mocks/AdminManagementVocabularyFixture.json";
import type {
  AdminManagementVocabularyState,
  AdminManagementVocabularyAction,
  Payload,
} from "@/app/frontend_admin/admin_management/management_vocabulary/types/AdminManagementVocabularyTypes";
import { demoSchema } from "@/app/frontend_admin/admin_management/management_vocabulary/schemas/AdminManagementVocabularySnapshotSchema";
import { vocabularyInput } from "@/app/frontend_admin/admin_management/management_vocabulary/schemas/AdminManagementVocabularyInputSchema";
import { ensure } from "@/app/frontend_admin/admin_management/management_vocabulary/utils/AdminManagementVocabularyAmounts";

export function createPresentationSeed(): AdminManagementVocabularyState {
  return structuredClone(seed) as AdminManagementVocabularyState;
}

export const STORAGE_KEY = "clothes-shop.demo.next.v1";

export function transition(
  previous: AdminManagementVocabularyState,
  action: AdminManagementVocabularyAction,
  _at = new Date().toISOString(),
): AdminManagementVocabularyState {
  if (!(["manage-vocabulary"] as readonly string[]).includes(action.type))
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
  if (action.type === "manage-vocabulary")
    manageVocabulary(next, payload.operation);
  next.revision = previous.revision + 1;
  return demoSchema.parse(next);
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function manageVocabulary(
  s: AdminManagementVocabularyState,
  input: unknown,
) {
  const d = vocabularyInput.parse(input),
    list = s[d.kind],
    key = d.kind === "departments" ? "departmentId" : "categoryId";
  if (d.remove || d.replacement) {
    ensure(list.includes(d.name), "Vocabulary not found.");
    if (d.remove) {
      ensure(
        !s.products.some((p) => p[key] === d.name),
        "A design still uses this vocabulary, including archived designs.",
      );
      s[d.kind] = list.filter((v) => v !== d.name);
    } else {
      ensure(
        !list.some((v) => v.toLowerCase() === d.replacement!.toLowerCase()),
        "Name already exists.",
      );
      s[d.kind] = list.map((v) => (v === d.name ? d.replacement! : v));
      s.products.forEach((p) => {
        if (p[key] === d.name) p[key] = d.replacement!;
      });
    }
  } else {
    ensure(
      !list.some((v) => v.toLowerCase() === d.name.toLowerCase()),
      "Name already exists.",
    );
    list.push(d.name);
  }
}
