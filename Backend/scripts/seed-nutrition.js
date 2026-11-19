// Seeds the customer app's Nutrition Information page (Super Admin > User App > Nutrition Info)
// with one entry per active menu product: name, image, description and category come from the product.
//
// The numbers are ESTIMATES by food type (pizza slice, pasta, burger, ...) so the page is not empty.
// Replace them with the lab / recipe values in the super admin panel before relying on them.
//
// Run: node scripts/seed-nutrition.js          (adds the products that have no entry yet)
//      node scripts/seed-nutrition.js --reset  (also overwrites entries this script made before)
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Product } from '../src/modules/food/admin/models/product.model.js';
import { FoodNutritionItem } from '../src/modules/food/settings/models/nutrition.model.js';

const KEYS = ['calories', 'totalFat', 'satFat', 'transFat', 'cholesterol', 'sodium', 'carbs', 'fiber', 'sugars', 'protein', 'calcium', 'iron'];
const base = (...v) => Object.fromEntries(KEYS.map((k, i) => [k, v[i]]));
const add = (n, d) => { for (const k in d) n[k] = Math.max(0, +(n[k] + d[k]).toFixed(1)); };
const has = (name, ...words) => words.some((w) => name.includes(w));

// A pizza slice is 1/8 of a Medium pizza.
function pizza(name, category) {
  const n = { ...base(205, 8, 3.5, 0, 14, 420, 26, 2, 3, 8, 12, 6) };
  const allergens = new Set(['Gluten', 'Dairy']);
  const eachTopping = [
    [['PANEER'], { calories: 32, totalFat: 2.5, satFat: 1.2, cholesterol: 4, protein: 2.5, calcium: 4 }],
    [['ALOO'], { calories: 14, carbs: 3, fiber: 0.4 }],
    [['CORN'], { calories: 10, carbs: 2, sugars: 1 }],
    [['TANDOORI', 'SMOKY', 'KADHAI', 'KOREAN', 'CHILLI', 'CHILI'], { sodium: 60, calories: 8 }],
    [['MAKHANI', 'MAKHNI'], { calories: 22, totalFat: 2.5, satFat: 1.2, sugars: 1.5 }],
    [['CHEESE', 'CHEESY', 'WHITE'], { calories: 25, totalFat: 2.2, satFat: 1.4, calcium: 4, sodium: 40 }],
    [['VEGGIE', 'FARM', 'CAPSICUM'], { calories: -4, fiber: 0.6 }],
  ];
  for (const [words, d] of eachTopping) if (has(name, ...words)) add(n, d);
  if (/LAAVA|LAVA/.test(category.toUpperCase())) add(n, { calories: 48, totalFat: 4, satFat: 2.4, sodium: 70, calcium: 7, protein: 1.5 });
  if (has(name, 'MAKHANI', 'MAKHNI')) allergens.add('Nuts');
  if (has(name, 'TANDOORI', 'KOREAN', 'MUSTARD')) allergens.add('Mustard');
  if (has(name, 'CHILLI', 'CHILI', 'KOREAN')) allergens.add('Soy');
  let serving = '1 slice (Medium, ~95 g)';
  const combo = / \+ /.test(name);
  if (combo) serving = '1 slice (Medium, 2 flavours)';
  return { ...n, servingSize: serving, allergens: [...allergens] };
}

// Wow Ultimate pizzas have a single Regular size: the whole pizza is the serving.
function wowPizza(name, category) {
  const p = pizza(name, category);
  const m = 2.4;
  for (const k of KEYS) p[k] = Math.round(p[k] * m * (k === 'transFat' ? 1 : 1) * 10) / 10;
  p.servingSize = '1 pizza (Regular, ~230 g)';
  return p;
}

const FIXED = {
  pasta: () => ({ ...base(390, 15, 7, 0, 32, 790, 49, 3, 6, 13, 20, 10), servingSize: 'Half portion (~250 g)', allergens: ['Gluten', 'Dairy'] }),
  breadsticks: () => ({ ...base(285, 11, 4.5, 0, 14, 510, 38, 2, 3, 8, 10, 12), servingSize: '4 pieces (~110 g)', allergens: ['Gluten', 'Dairy'] }),
  parcel: () => ({ ...base(335, 15, 6, 0, 20, 640, 40, 3, 4, 10, 16, 10), servingSize: '1 parcel (~150 g)', allergens: ['Gluten', 'Dairy'] }),
  taco: () => ({ ...base(235, 10, 4, 0, 12, 420, 29, 3, 3, 6, 10, 8), servingSize: '1 taco (~120 g)', allergens: ['Gluten', 'Dairy'] }),
  burger: () => ({ ...base(425, 18, 6, 0, 25, 820, 52, 4, 7, 13, 14, 14), servingSize: '1 burger (~210 g)', allergens: ['Gluten', 'Dairy', 'Soy'] }),
  fries: () => ({ ...base(280, 14, 2, 0, 0, 320, 35, 3, 0, 3, 1, 4), servingSize: 'Half portion (~100 g)', allergens: [] }),
  pizzadilla: () => ({ ...base(390, 17, 7, 0, 28, 740, 42, 3, 4, 14, 20, 10), servingSize: '1 piece (~180 g)', allergens: ['Gluten', 'Dairy'] }),
  quesadilla: () => ({ ...base(410, 18, 8, 0, 32, 760, 41, 3, 3, 15, 22, 10), servingSize: '1 piece (~190 g)', allergens: ['Gluten', 'Dairy'] }),
  bowl: () => ({ ...base(330, 14, 6, 0, 22, 610, 34, 6, 6, 14, 20, 12), servingSize: '1 bowl (~300 g)', allergens: ['Dairy'] }),
  sandwich: () => ({ ...base(360, 14, 5, 0, 18, 690, 44, 3, 6, 12, 14, 10), servingSize: '1 sandwich (~170 g)', allergens: ['Gluten', 'Dairy'] }),
  beverage: () => ({ ...base(210, 6, 3.5, 0, 15, 90, 34, 0, 30, 5, 15, 2), servingSize: '300 ml', allergens: ['Dairy'] }),
  dessert: () => ({ ...base(360, 17, 8, 0, 25, 220, 46, 3, 30, 5, 6, 14), servingSize: '1 piece (~90 g)', allergens: ['Gluten', 'Dairy'] }),
};

function profileFor(product, category) {
  const name = product.name.toUpperCase();
  const cat = category.toUpperCase();
  let p;
  if (cat.includes('WOW ULTIMATE')) p = wowPizza(name, cat);
  else if (/PASTA/.test(cat)) p = FIXED.pasta();
  else if (/BREADSTICK/.test(cat)) {
    p = FIXED.breadsticks();
    if (has(name, 'CHEESE LAVA')) add(p, { calories: 70, totalFat: 5, satFat: 3, calcium: 8 });
    if (has(name, 'PANEER')) add(p, { calories: 30, protein: 2, totalFat: 2 });
    if (has(name, 'CORN')) add(p, { calories: 12, carbs: 2 });
  } else if (/PARCEL/.test(cat)) p = FIXED.parcel();
  else if (/TACO/.test(cat)) { p = FIXED.taco(); if (has(name, 'PANEER')) add(p, { calories: 25, protein: 2.5, totalFat: 2 }); }
  else if (/BURGER/.test(cat)) { p = FIXED.burger(); if (has(name, 'PANEER')) add(p, { calories: 40, protein: 4, totalFat: 3 }); if (has(name, 'PIZZA')) add(p, { calories: 30, totalFat: 3, calcium: 6 }); }
  else if (/FRIES/.test(cat)) {
    p = FIXED.fries();
    if (has(name, 'PERI')) add(p, { calories: 15, sodium: 150 });
    if (has(name, 'LOADED')) { add(p, { calories: 120, totalFat: 9, satFat: 4.5, cholesterol: 18, sodium: 260, protein: 5, calcium: 12 }); p.allergens = ['Dairy']; }
    if (has(name, 'PLAIN')) add(p, { sodium: -60 });
  } else if (/PIZZADILLA/.test(cat)) { p = FIXED.pizzadilla(); if (has(name, 'ALOO')) add(p, { carbs: 5, protein: -2 }); }
  else if (/QUESADILLA/.test(cat)) p = FIXED.quesadilla();
  else if (/SALAD/.test(cat)) { p = FIXED.bowl(); if (has(name, 'PANEER', 'MUSHROOM')) add(p, { calories: 45, protein: 4 }); }
  else if (/SANDWICH/.test(cat)) p = FIXED.sandwich();
  else if (/BEVERAGE/.test(cat)) {
    p = FIXED.beverage();
    if (has(name, 'ICED TEA')) { Object.assign(p, base(95, 0, 0, 0, 0, 20, 23, 0, 22, 0, 0, 1), { allergens: [] }); }
    else if (has(name, 'OREO', 'CHOCO')) { add(p, { calories: 60, sugars: 8, carbs: 9 }); p.allergens = ['Gluten', 'Dairy']; }
    else if (has(name, 'STRAWBERRY')) add(p, { calories: 20, sugars: 3 });
    else if (has(name, 'STRONG')) add(p, { calories: -15, sugars: -4 });
  } else if (/DESSERT/.test(cat)) { p = FIXED.dessert(); if (has(name, 'BROWNIE')) { add(p, { calories: -40, totalFat: -2 }); p.allergens = ['Gluten', 'Dairy', 'Nuts']; } }
  else p = pizza(name, cat);
  return p;
}

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(/&,+-])([a-z])/g, (_, a, b) => a + b.toUpperCase());

await connectDB();
const db = Product.db;
const cats = Object.fromEntries((await db.collection('categoryproducts').find({}).toArray()).map((c) => [String(c._id), c]));
const products = await db.collection('products').find({ status: 'Active' }).toArray();
products.sort((a, b) => (cats[String(a.categoryId)]?.sort ?? 99) - (cats[String(b.categoryId)]?.sort ?? 99) || String(a._id).localeCompare(String(b._id)));

const reset = process.argv.includes('--reset');
const existing = new Map((await FoodNutritionItem.find({ productId: { $ne: '' } }).select('productId').lean()).map((i) => [i.productId, i._id]));
let added = 0, updated = 0, order = 0;
for (const p of products) {
  const cat = cats[String(p.categoryId)];
  const category = cat?.label || 'Menu';
  const { servingSize, allergens, ...nums } = profileFor(p, category);
  const doc = {
    name: titleCase(p.name),
    description: p.shortDescription || p.description || '',
    category,
    image: p.image || '',
    productId: String(p._id),
    servingSize,
    ...nums,
    allergens,
    sortOrder: order++,
    isActive: true,
  };
  const id = existing.get(doc.productId);
  if (id) {
    if (reset) { await FoodNutritionItem.updateOne({ _id: id }, { $set: doc }); updated++; }
  } else {
    await FoodNutritionItem.create(doc); added++;
  }
}
console.log(`Nutrition items: ${added} added, ${updated} updated, ${products.length} products.`);
await mongoose.disconnect();
