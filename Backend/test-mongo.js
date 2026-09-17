import mongoose from 'mongoose';
import { FoodStore } from './src/modules/food/store/models/store.model.js';
mongoose.connect('mongodb+srv://papafoodcorporation_db_user:behP8R1Fti77UrVf@papa-veg-pizza.ugrhivy.mongodb.net/?appName=Papa-veg-pizza');
setTimeout(async () => {
    const stores = await FoodStore.find().sort({createdAt: -1}).limit(5).lean();
    console.log(JSON.stringify(stores, null, 2));
    process.exit(0);
}, 2000);
