import { z } from 'zod';
import { sendError } from '../../../../utils/response.js';

export const validateUiOffer = (req, res, next) => {
    const schema = z.object({
        title: z.string().min(1, 'Title is required'),
        subtitle: z.string().optional(),
        iconImage: z.string().optional(),
        backgroundColorToken: z.string().optional(),
        buttonText: z.string().optional(),
        actionType: z.enum(['apply_coupon', 'open_product', 'open_category', 'open_url']),
        actionValue: z.string().optional(),
        showDetailsModal: z.boolean().optional(),
        offerDetails: z.array(z.string()).optional(),
        minOrderValue: z.number().min(0).optional(),
        maxDiscount: z.number().min(0).optional(),
        couponCode: z.string().optional(),
        startDate: z.string().nullable().optional(), // accept date strings or null
        endDate: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional()
    });

    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        return sendError(res, 400, error.errors[0].message);
    }
};

export const validateHomeSection = (req, res, next) => {
    const schema = z.object({
        type: z.enum(['offers', 'category_list', 'banner']),
        referenceId: z.string().nullable().optional(),
        refModel: z.enum(['Category', 'FoodBanner']).nullable().optional(),
        title: z.string().optional(),
        platform: z.enum(['all', 'web', 'app']).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional()
    });

    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        return sendError(res, 400, error.errors[0].message);
    }
};

export const validateReorder = (req, res, next) => {
    const schema = z.object({
        modelName: z.enum(['UiOffer', 'HomeSection']),
        items: z.array(z.object({
            id: z.string().min(1),
            sortOrder: z.number()
        })).min(1)
    });

    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        return sendError(res, 400, error.errors[0].message);
    }
};

export const validateToggleActive = (req, res, next) => {
    const schema = z.object({
        modelName: z.enum(['UiOffer', 'HomeSection']),
        isActive: z.boolean()
    });

    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        return sendError(res, 400, error.errors[0].message);
    }
};

