import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './src/config/env.js';

async function check() {
    await mongoose.connect(config.mongodbUri);
    const db = mongoose.connection.db;
    
    const franchises = await db.collection('food_franchises').find({}).toArray();
    console.log("Total franchises:", franchises.length);
    console.log("Franchises:");
    franchises.forEach(f => {
        console.log(`- ${f.name} (Code: ${f.franchiseCode}, Email: ${f.email}, ownerName: ${f.ownerName})`);
    });

    const admins = await db.collection('food_admins').find({}).toArray().catch(() => []);
    console.log("Total food_admins:", admins.length);

    await mongoose.disconnect();
}
check();
