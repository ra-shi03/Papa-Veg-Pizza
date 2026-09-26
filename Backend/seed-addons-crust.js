import mongoose from "mongoose";
import { Addon } from "./src/modules/food/admin/models/addon.model.js";

async function seedAddons() {
  await mongoose.connect("mongodb+srv://papafoodcorporation_db_user:behP8R1Fti77UrVf@papa-veg-pizza.ugrhivy.mongodb.net/?appName=Papa-veg-pizza");
  
  const newAddons = [
    { name: "Buttery Pen", type: "Crust" },
    { name: "Herby Crust", type: "Crust" },
    { name: "Thin Crust", type: "Crust" },
    { name: "Fresh Garlic Crust", type: "Crust" }
  ];

  const prices = [
    { size: "Regular", price: 20 },
    { size: "Medium", price: 40 },
    { size: "Large", price: 60 }
  ];

  for (const item of newAddons) {
    const existing = await Addon.findOne({ name: item.name });
    if (!existing) {
      await Addon.create({
        name: item.name,
        type: item.type,
        prices: prices,
        image: "",
        status: "Active"
      });
      console.log(`Added: ${item.name}`);
    } else {
      console.log(`Already exists: ${item.name}`);
    }
  }

  process.exit(0);
}
seedAddons();
