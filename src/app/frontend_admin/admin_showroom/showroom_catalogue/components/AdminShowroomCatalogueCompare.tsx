"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import {
  useAdminShowroomCatalogue,
  useAdminShowroomCatalogueOffers,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueStore";
import {
  bestOffer,
  priceFor,
  sellable,
} from "@/app/frontend_admin/admin_showroom/showroom_catalogue/state/AdminShowroomCatalogueTransactions";
import { money } from "@/app/frontend_admin/admin_showroom/showroom_catalogue/utils/AdminShowroomCatalogueAmounts";
import { Button } from "@/components/ui/Button";
import { resolveCatalogueProductImage } from "@/lib/product_images";
export function AdminShowroomCatalogueCompare({
  ids,
  onClose,
  onView,
}: {
  ids: string[];
  onClose: () => void;
  onView: (id: string) => void;
}) {
  const t = useTranslations("showroom"),
    state = useAdminShowroomCatalogue((s) => s.state);
  const offers = useAdminShowroomCatalogueOffers();
  const vs = ids
    .map((id) => state.variants.find((v) => v.id === id))
    .filter((v) => !!v);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-backdrop" />
        <Dialog.Content className="fixed inset-3 z-50 m-auto max-h-[90dvh] max-w-5xl overflow-auto rounded-xl bg-card p-6 shadow-dialog">
          <Dialog.Title className="text-2xl font-semibold">
            {t("compare")}
          </Dialog.Title>
          <Dialog.Description className="my-3 text-secondary">
            {t("compareNote")}
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button>{t("closeCompare")}</Button>
          </Dialog.Close>
          <div className="mt-5 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>{t("attribute")}</th>
                  {vs.map((v) => {
                    const prod = state.products.find((p) => p.id === v.productId);
                    const imgSrc = resolveCatalogueProductImage(prod?.id || "", prod?.name, prod?.categoryId, v.colour);
                    return (
                      <th className="min-w-48 p-3 align-top" key={v.id}>
                        <div className="flex flex-col items-start gap-2">
                          <img src={imgSrc} alt={prod?.name || ""} className="size-16 object-contain rounded-lg border border-border bg-subtle p-1" />
                          <div>
                            <span className="font-semibold text-foreground block">{prod?.name}</span>
                            <p className="font-normal text-xs text-muted-foreground">{v.sku}</p>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  "colour",
                  "size",
                  "fabric",
                  "fit",
                  "sleeve",
                  "collar",
                  "packUnit",
                  "price",
                  "stock",
                ].map((key) => (
                  <tr key={key} className="border-t border-border">
                    <th className="p-3">{t(key)}</th>
                    {vs.map((v) => {
                      const p = state.products.find(
                        (p) => p.id === v.productId,
                      )!;
                      const value =
                        key === "price"
                          ? money(
                              priceFor(state, v) -
                                (bestOffer(
                                  offers.offers,
                                  v.productId,
                                  priceFor(state, v),
                                  offers.now,
                                )?.discount || 0),
                            )
                          : key === "stock"
                            ? sellable(state, v.id)
                            : key === "size"
                              ? v.sizeCode
                              : key === "colour"
                                ? v.colour
                                : key === "packUnit"
                                  ? v.packUnit
                                  : p[
                                      key as
                                        "fabric" | "fit" | "sleeve" | "collar"
                                    ];
                      return (
                        <td className="p-3" key={v.id}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td />
                  {vs.map((v) => (
                    <td className="p-3" key={v.id}>
                      <Button onClick={() => onView(v.id)}>{t("view")}</Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
