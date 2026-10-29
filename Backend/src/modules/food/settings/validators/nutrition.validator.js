import { z } from 'zod';
import { sendError } from '../../../../utils/response.js';

const amount = z.coerce.number({ invalid_type_error: 'Nutrition values must be numbers' }).min(0, 'Nutrition values cannot be negative').max(100000);
const text = (max) => z.string().trim().max(max);

const itemSchema = z.object({
    name: text(120).min(1, 'Name is required'),
    description: text(500).optional(),
    category: text(60).optional(),
    image: text(1000).optional(),
    productId: text(60).optional(),
    servingSize: text(60).optional(),
    calories: amount.optional(),
    totalFat: amount.optional(),
    satFat: amount.optional(),
    transFat: amount.optional(),
    cholesterol: amount.optional(),
    sodium: amount.optional(),
    carbs: amount.optional(),
    fiber: amount.optional(),
    sugars: amount.optional(),
    protein: amount.optional(),
    calcium: amount.optional(),
    iron: amount.optional(),
    allergens: z.array(text(40).min(1)).max(20).optional(),
    sortOrder: z.coerce.number().int().optional(),
    isActive: z.boolean().optional()
});

const pageSchema = z.object({
    headline: text(120).optional(),
    intro: text(500).optional(),
    allergenNote: text(500).optional(),
    disclaimer: text(500).optional()
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) return sendError(res, 400, result.error.errors[0]?.message || 'Validation failed');
    req.body = result.data;
    next();
};

export const validateNutritionItem = validate(itemSchema);
export const validateNutritionItemUpdate = validate(itemSchema.partial());
export const validateNutritionPage = validate(pageSchema);
