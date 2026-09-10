import { z } from "zod";

export const pricingSchema = z.object({
  smallPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative")
  ),
  mediumPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative")
  ),
  largePrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative")
  ),
  deliveryPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative")
  ),
  takeawayPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative")
  ),
  dineInPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative")
  ),
  specialPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative")
  ),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  availability: z.enum(["AVAILABLE", "UNAVAILABLE", "PROMOTION ACTIVE"]).default("AVAILABLE"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
}).refine(
  (data) => {
    if (data.availability === "PROMOTION ACTIVE") {
      if (!data.startDate || !data.endDate) return false;
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);
