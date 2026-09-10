import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import { FoodFranchise } from './src/modules/food/franchise/models/franchise.model.js';
import { User } from './src/core/users/models/user.model.js';
import { Profile } from './src/core/users/models/profile.model.js';
import { Role } from './src/core/roles/models/role.model.js';
import { UserRole } from './src/core/roles/models/userRole.model.js';

async function fixOrphanFranchises() {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to DB');

    const franchises = await FoodFranchise.find({}).lean();
    console.log(`Found ${franchises.length} franchises.`);

    const franchiseAdminRole = await Role.findOne({ code: 'FRANCHISE_ADMIN' }).lean();
    if (!franchiseAdminRole) {
        console.error('FRANCHISE_ADMIN role not found. Run seed-roles.js first.');
        process.exit(1);
    }

    let fixedCount = 0;

    for (const fran of franchises) {
        const email = fran.email.toLowerCase();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email }).lean();
        if (existingUser) {
            console.log(`User already exists for ${email}. Skipping.`);
            continue;
        }

        console.log(`Creating missing user account for ${email}...`);

        // Create User
        const newUser = await User.create({
            email: email,
            mobile: fran.phone || `ORPHAN-${fran._id}`,
            password: 'Password123!', // Default password
            loginType: 'PASSWORD',
            primaryRole: franchiseAdminRole._id,
            emailVerified: true,
            mobileVerified: true,
            isActive: fran.isActive,
            isDeleted: false
        });

        // Create Profile
        const nameParts = String(fran.ownerName || fran.managerName || 'Franchise Admin').trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        await Profile.create({
            userId: newUser._id,
            firstName,
            lastName,
            phone: fran.phone || ''
        });

        // Create UserRole
        await UserRole.create({
            userId: newUser._id,
            roleId: franchiseAdminRole._id,
            franchiseId: fran._id,
            storeId: null,
            isPrimary: true,
            status: fran.isActive ? 'ACTIVE' : 'SUSPENDED'
        });

        // Link franchise to owner
        await FoodFranchise.updateOne(
            { _id: fran._id },
            { $set: { ownerUserId: newUser._id } }
        );

        fixedCount++;
    }

    console.log(`Successfully fixed ${fixedCount} orphan franchises.`);
    await mongoose.disconnect();
}

fixOrphanFranchises().catch(err => {
    console.error(err);
    process.exit(1);
});
