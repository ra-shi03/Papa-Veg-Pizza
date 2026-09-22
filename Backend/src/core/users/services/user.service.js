import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Profile } from '../models/profile.model.js';
import { Role } from '../../roles/models/role.model.js';
import { UserRole } from '../../roles/models/userRole.model.js';
// Add StoreManager import here if needed in the future

/**
 * Service to handle complex user creation using Mongoose Transactions.
 * Ensures that if any part of the creation fails (User, Profile, UserRole),
 * everything is rolled back, preventing orphaned data.
 */
export const createStaffUser = async (staffData) => {
    // 1. Start a Mongoose Session for the Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Fetch the correct Role ID from the database
        // e.g., staffData.roleCode could be "STORE_MANAGER", "FRANCHISE_ADMIN", etc.
        const role = await Role.findOne({ code: staffData.roleCode }).session(session);
        if (!role) throw new Error(`Role ${staffData.roleCode} not found in database.`);

        // 3. Create the Base User (Auth details)
        // Explicitly hash the password since the model no longer auto-hashes
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.default.genSalt(12);
        const hashedPassword = await bcrypt.default.hash(staffData.password, salt);

        const newUser = new User({
            email: staffData.email,
            mobile: staffData.mobile,
            password: hashedPassword, 
            primaryRole: role._id,
            loginType: 'PASSWORD'
        });
        await newUser.save({ session }); // Pass the transaction session

        // 4. Create the User Profile (Personal details)
        const newProfile = new Profile({
            userId: newUser._id,
            firstName: staffData.firstName,
            lastName: staffData.lastName,
            phone: staffData.mobile,
            // Include any other profile fields provided
            ...staffData.profileDetails 
        });
        await newProfile.save({ session });

        // 5. Assign the User to the Role, Franchise, and Store
        const newUserRole = new UserRole({
            userId: newUser._id,
            roleId: role._id,
            franchiseId: staffData.franchiseId || null,
            storeId: staffData.storeId || null,
            isPrimary: true,
            status: 'ACTIVE'
        });
        await newUserRole.save({ session });

        // 6. (Optional) Create any specific sub-role records
        // Uncomment and import StoreManager if you use a specific schema for them
        /*
        if (staffData.roleCode === 'STORE_MANAGER' && staffData.storeId) {
             const managerRecord = new StoreManager({
                 storeId: staffData.storeId,
                 userId: newUser._id
             });
             await managerRecord.save({ session });
        }
        */

        // 7. Commit the transaction! If we reach here, everything succeeded safely.
        await session.commitTransaction();
        session.endSession();

        // Return the created user with its ID
        return newUser; 

    } catch (error) {
        // If ANY error occurs above, rollback ALL changes across all collections
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
