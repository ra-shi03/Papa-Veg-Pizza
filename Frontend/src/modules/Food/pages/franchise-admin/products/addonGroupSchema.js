import { z } from "zod";

export const addonGroupSchema = z.object({
  name: z.string()
    .min(3, "Group Name must be at least 3 characters")
    .max(50, "Group Name must not exceed 50 characters")
    .nonempty("Group Name is required"),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  minSelection: z.coerce.number()
    .int("Minimum Selection must be an integer")
    .min(0, "Minimum Selection cannot be negative")
    .default(0),
  maxSelection: z.coerce.number()
    .int("Maximum Selection must be an integer")
    .min(1, "Maximum Selection must be at least 1")
    .default(1),
  isRequired: z.boolean().default(false),
  addonIds: z.array(z.string()).min(1, "Please select at least one add-on to include in this group")
}).refine((data) => data.maxSelection >= data.minSelection, {
  message: "Maximum Selection must be greater than or equal to Minimum Selection",
  path: ["maxSelection"]
});
