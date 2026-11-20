import { studioText as t } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioMessages";
import { z } from "zod";
export const catalogueSchema = z.object({
  products: z.array(
    z.object({ id: z.string(), name: z.string(), status: z.string() }),
  ),
  variants: z.array(
    z.object({
      id: z.string(),
      productId: z.string(),
      colour: z.string(),
      sizeCode: z.string(),
      status: z.string(),
    }),
  ),
  images: z.array(
    z.object({
      productId: z.string(),
      colour: z.string().optional(),
      angle: z.string(),
      kind: z.string(),
      srcOrAssetKey: z.string(),
      label: z.string(),
    }),
  ),
});
export type Catalogue = z.infer<typeof catalogueSchema>;
export const preferencesSchema = z.record(
  z.object({
    order: z.array(z.string()).default([]),
    measurements: z
      .array(
        z.object({
          size: z.string(),
          chest: z.number().positive().max(300),
          waist: z.number().positive().max(300),
          length: z.number().positive().max(300),
        }),
      )
      .default([]),
    overlays: z
      .record(
        z
          .string()
          .max(1200000)
          .refine(
            (value) =>
              value === "" ||
              /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value),
            t("message139"),
          ),
      )
      .default({}),
  }),
);
export type Preferences = z.infer<typeof preferencesSchema>;
