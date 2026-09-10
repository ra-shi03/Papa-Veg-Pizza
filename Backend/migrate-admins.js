import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const admins = await db.collection('food_admins').find({}).toArray();

        for (const admin of admins) {
            if (!admin.firstName && admin.name) {
                const parts = admin.name.trim().split(' ');
                const firstName = parts[0] || 'Admin';
                const lastName = parts.slice(1).join(' ') || '';
                
                await db.collection('food_admins').updateOne(
                    { _id: admin._id },
                    { $set: { firstName, lastName }, $unset: { name: 1 } }
                );
                console.log(`Updated admin ${admin.email}: ${firstName} ${lastName}`);
            } else if (!admin.firstName) {
                await db.collection('food_admins').updateOne(
                    { _id: admin._id },
                    { $set: { firstName: 'Super', lastName: 'Admin' } }
                );
                console.log(`Updated admin ${admin.email} with defaults`);
            }
        }
        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
