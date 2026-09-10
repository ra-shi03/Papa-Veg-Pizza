import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  sku: z.string().optional(),
  shortDescription: z.string().max(160, "Short description must be under 160 characters").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  
  productType: z.enum(["VEG", "NON_VEG", "EGG"]),
  preparationTime: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Preparation time must be a number" })
      .min(1, "Preparation time must be at least 1 minute")
  ),
  calories: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0, "Calories cannot be negative").default(0)
  ),
  spiceLevel: z.number().min(1).max(5).default(1),

  image: z.string().optional(),
  galleryImages: z.array(z.string()).default([]),

  basePrice: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Base price must be a number" })
      .min(1, "Base price must be at least \u20B91")
  ),
  taxCategory: z.string().default("gst-5"),
  
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isCustomizable: z.boolean().default(false),
  
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  displayOrder: z.preprocess(
    (val) => (val === "" ? 1 : Number(val)),
    z.number().min(1).default(1)
  ),
  
  // Array of store availability settings for Step 5
  storesAvailability: z.array(
    z.object({
      storeId: z.string(),
      available: z.boolean().default(true),
      overridePrice: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(0).optional()
      )
    })
  ).default([])
});

export const variantSchema = z.object({
  name: z.string().min(1, "Variant Name is required"),
  size: z.enum(["Small", "Medium", "Large"]),
  price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" })
      .min(1, "Price must be at least \u20B91")
  ),
  servingPersons: z.preprocess(
    (val) => (val === "" ? 1 : Number(val)),
    z.number().int().min(1, "Must serve at least 1 person")
  ),
  calories: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().min(0, "Calories cannot be negative")
  ),
  isDefault: z.boolean().default(false),
  status: z.boolean().default(true)
});
