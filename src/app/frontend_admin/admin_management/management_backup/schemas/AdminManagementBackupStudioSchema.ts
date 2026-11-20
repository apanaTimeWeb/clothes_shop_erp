import { z } from "zod";
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
            (value) => value === "" || /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value),
            "Only embedded PNG cutouts are accepted",
          ),
      )
      .default({}),
  }),
);
export type Preferences = z.infer<typeof preferencesSchema>;
