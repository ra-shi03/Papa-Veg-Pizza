import mongoose from 'mongoose';
import { User } from './src/core/users/models/user.model.js';
mongoose.connect('mongodb+srv://REDACTED:REDACTED@papa-veg-pizza.ugrhivy.mongodb.net/?appName=Papa-veg-pizza');
setTimeout(async () => {
    const users = await User.find().limit(3).lean();
    console.log(JSON.stringify(users.map(u => ({ role: u.role, _id: u._id, franchiseId: u.franchiseId })), null, 2));
    process.exit(0);
}, 2000);
