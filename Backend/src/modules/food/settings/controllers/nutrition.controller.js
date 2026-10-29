import * as nutritionService from '../services/nutrition.service.js';
import { sendResponse } from '../../../../utils/response.js';

const handle = (fn, status = 200, message = 'OK') => async (req, res, next) => {
    try {
        return sendResponse(res, status, message, await fn(req));
    } catch (err) {
        next(err);
    }
};

export const getPublicNutrition = handle(() => nutritionService.getPublicNutrition());
export const getAdminNutrition = handle(() => nutritionService.getAdminNutrition());
export const updateNutritionPage = handle((req) => nutritionService.updatePage(req.body), 200, 'Page updated');
export const createNutritionItem = handle((req) => nutritionService.createItem(req.body), 201, 'Item added');
export const updateNutritionItem = handle((req) => nutritionService.updateItem(req.params.id, req.body), 200, 'Item updated');
export const deleteNutritionItem = handle((req) => nutritionService.deleteItem(req.params.id), 200, 'Item deleted');
export const addStarterNutritionItems = handle(() => nutritionService.addStarterItems(), 200, 'Starter items added');
