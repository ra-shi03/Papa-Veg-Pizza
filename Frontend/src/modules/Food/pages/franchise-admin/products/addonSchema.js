import { z } from "zod";

export const addonSchema = z.object({
  name: z.string()
    .min(3, "Add-on Name must be at least 3 characters")
    .max(50, "Add-on Name must not exceed 50 characters")
    .nonempty("Add-on Name is required"),
  type: z.enum(["TOPPING", "CHEESE", "SAUCE", "EXTRA"], {
    errorMap: () => ({ message: "Please select a valid add-on type" })
  }),
  price: z.coerce.number()
    .min(0, "Price must be a non-negative number")
    .refine((val) => !isNaN(val), "Price is required"),
  description: z.string().max(200, "Description must not exceed 200 characters").optional().or(z.literal("")),
  inventoryItemId: z.string().nullable().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]).default("ACTIVE"),
  image: z.string().optional().or(z.literal(""))
});
