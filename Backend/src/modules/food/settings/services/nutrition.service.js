import mongoose from 'mongoose';
import { FoodNutritionItem, FoodNutritionPage } from '../models/nutrition.model.js';
import { NotFoundError } from '../../../../core/auth/errors.js';

// The values the customer app used to hard-code. Added only when the super admin asks for them ("Add starter items").
const STARTER_ITEMS = [
    { name: 'Classic Margherita Pizza', category: 'Pizzas', description: 'Simple yet elegant classic with our signature pizza sauce and 100% vegetarian mozzarella cheese.', servingSize: '1 slice (105g)', calories: 220, totalFat: 7, satFat: 3, transFat: 0, cholesterol: 15, sodium: 420, carbs: 28, fiber: 2, sugars: 3, protein: 9, calcium: 12, iron: 6, allergens: ['Gluten', 'Dairy'] },
    { name: 'Paneer Tikka Pizza', category: 'Pizzas', description: 'Spicy marinated paneer chunks, crisp capsicum, onions, and red paprika on cheese-burst base.', servingSize: '1 slice (130g)', calories: 320, totalFat: 14, satFat: 6, transFat: 0, cholesterol: 25, sodium: 560, carbs: 33, fiber: 3, sugars: 4, protein: 15, calcium: 22, iron: 10, allergens: ['Gluten', 'Dairy', 'Mustard'] },
    { name: 'Garden Veggie Supreme Pizza', category: 'Pizzas', description: 'Loaded with fresh mushrooms, green olives, sweet corn, red bell peppers, and fresh jalapenos.', servingSize: '1 slice (115g)', calories: 240, totalFat: 8, satFat: 3.5, transFat: 0, cholesterol: 15, sodium: 480, carbs: 31, fiber: 3, sugars: 4, protein: 10, calcium: 15, iron: 8, allergens: ['Gluten', 'Dairy'] },
    { name: 'Veggie Overload Oval Flatz', category: 'Pizzas', description: 'Our signature artisanal flatbread crust loaded with seasonal organic vegetables and light cheese.', servingSize: '1 slice (120g)', calories: 270, totalFat: 9, satFat: 4, transFat: 0, cholesterol: 15, sodium: 510, carbs: 34, fiber: 4, sugars: 5, protein: 11, calcium: 18, iron: 10, allergens: ['Gluten', 'Dairy'] },
    { name: 'Stuffed Crust Veg Treat', category: 'Pizzas', description: 'Pizza crust stuffed with garlic cream cheese, topped with gold corn, paneer and red paprika.', servingSize: '1 slice (140g)', calories: 350, totalFat: 16, satFat: 8, transFat: 0, cholesterol: 35, sodium: 650, carbs: 36, fiber: 3, sugars: 4, protein: 16, calcium: 25, iron: 12, allergens: ['Gluten', 'Dairy'] },
    { name: 'Garlic Breadsticks', category: 'Sides', description: 'Freshly baked breadsticks infused with garlic butter and herbs, served with cheesy dip.', servingSize: '2 pieces (75g)', calories: 190, totalFat: 6, satFat: 2.5, transFat: 0, cholesterol: 10, sodium: 360, carbs: 26, fiber: 1, sugars: 2, protein: 6, calcium: 8, iron: 6, allergens: ['Gluten', 'Dairy'] },
    { name: 'Choco Lava Cake', category: 'Desserts', description: 'Decadent chocolate cake filled with warm liquid chocolate center, 100% eggless.', servingSize: '1 cake (90g)', calories: 380, totalFat: 18, satFat: 9, transFat: 0, cholesterol: 20, sodium: 210, carbs: 48, fiber: 3, sugars: 32, protein: 5, calcium: 6, iron: 15, allergens: ['Gluten', 'Dairy', 'Soy'] },
];

const ORDER = { sortOrder: 1, createdAt: 1 };

async function getPage() {
    const page = await FoodNutritionPage.findOne().lean();
    return page || new FoodNutritionPage().toObject();
}

const pageFields = ({ headline, intro, allergenNote, disclaimer }) => ({ headline, intro, allergenNote, disclaimer });

/** Customer app: the page copy, the active items and the allergens that appear on them. */
export async function getPublicNutrition() {
    const [page, items] = await Promise.all([
        getPage(),
        FoodNutritionItem.find({ isActive: true }).sort(ORDER).select('-__v -createdAt -updatedAt').lean(),
    ]);
    const allergens = [...new Set(items.flatMap((i) => i.allergens || []))].sort();
    return { page: pageFields(page), items, allergens };
}

/** Super admin: the page copy and every item, active or not. */
export async function getAdminNutrition() {
    const [page, items] = await Promise.all([getPage(), FoodNutritionItem.find().sort(ORDER).lean()]);
    return { page: pageFields(page), items };
}

export async function updatePage(body) {
    const page = await FoodNutritionPage.findOneAndUpdate({}, { $set: body }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
    return pageFields(page);
}

export async function createItem(body) {
    if (body.sortOrder === undefined) {
        const last = await FoodNutritionItem.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
        body.sortOrder = (last?.sortOrder ?? -1) + 1;
    }
    return (await FoodNutritionItem.create(body)).toObject();
}

export async function updateItem(id, body) {
    if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Nutrition item not found');
    const item = await FoodNutritionItem.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).lean();
    if (!item) throw new NotFoundError('Nutrition item not found');
    return item;
}

export async function deleteItem(id) {
    if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Nutrition item not found');
    const item = await FoodNutritionItem.findByIdAndDelete(id).lean();
    if (!item) throw new NotFoundError('Nutrition item not found');
    return { _id: String(item._id) };
}

/** Adds the starter items whose names are not there yet. Returns how many were added. */
export async function addStarterItems() {
    const existing = new Set((await FoodNutritionItem.find().select('name').lean()).map((i) => i.name.toLowerCase()));
    const last = await FoodNutritionItem.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
    let next = (last?.sortOrder ?? -1) + 1;
    const toAdd = STARTER_ITEMS.filter((i) => !existing.has(i.name.toLowerCase())).map((i) => ({ ...i, sortOrder: next++ }));
    if (toAdd.length) await FoodNutritionItem.insertMany(toAdd);
    return { added: toAdd.length };
}
