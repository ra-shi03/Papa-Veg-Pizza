import { z } from "zod";

export const categorySchema = z.object({
  name: z.string()
    .min(3, "Category Name must be at least 3 characters")
    .max(50, "Category Name must not exceed 50 characters")
    .nonempty("Category Name is required"),
  slug: z.string().optional(),
  description: z.string().max(200, "Description must not exceed 200 characters").optional().or(z.literal("")),
  parentCategory: z.string().nullable().optional().or(z.literal("")),
  displayOrder: z.coerce.number()
    .int("Display Order must be a whole number")
    .positive("Display Order must be a positive number")
    .default(1),
  isFeatured: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  image: z.string().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal(""))
});
