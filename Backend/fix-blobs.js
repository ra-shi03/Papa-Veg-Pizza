import mongoose from "mongoose";
import { Addon } from "./src/modules/food/admin/models/addon.model.js";

async function fixBlobs() {
  await mongoose.connect("mongodb+srv://REDACTED:REDACTED@papa-veg-pizza.ugrhivy.mongodb.net/?appName=Papa-veg-pizza");
  const addons = await Addon.find({ image: { $regex: /^blob:/ } });
  console.log(`Found ${addons.length} addons with blob images.`);
  for (const addon of addons) {
    addon.image = "";
    await addon.save();
    console.log(`Fixed addon: ${addon.name}`);
  }
  process.exit(0);
}
fixBlobs();
