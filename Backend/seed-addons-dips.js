import mongoose from "mongoose";
import { Addon } from "./src/modules/food/admin/models/addon.model.js";

async function seedAddons() {
  await mongoose.connect("mongodb+srv://papafoodcorporation_db_user:behP8R1Fti77UrVf@papa-veg-pizza.ugrhivy.mongodb.net/?appName=Papa-veg-pizza");
  
  const newAddons = [
    { name: "Tandoori", type: "Dips" },
    { name: "Mayo", type: "Dips" },
    { name: "chatpati Chilli", type: "Dips" },
    { name: "Harisha", type: "Dips" },
    { name: "Korean Chilli", type: "Dips" },
    { name: "Thousand", type: "Dips" }
  ];

  const prices = [
    { size: "Regular", price: 25 },
    { size: "Medium", price: 25 },
    { size: "Large", price: 25 }
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
