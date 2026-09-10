import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import { Role } from './src/core/roles/models/role.model.js';
import { User } from './src/core/users/models/user.model.js';
import { Profile } from './src/core/users/models/profile.model.js';
import { UserRole } from './src/core/roles/models/userRole.model.js';

const seedRoles = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'System super administrator' },
    { code: 'FRANCHISE_ADMIN', name: 'Franchise Admin', description: 'Franchise level administrator' },
    { code: 'STORE_MANAGER', name: 'Store Manager', description: 'Store level manager' },
    { code: 'KITCHEN_SUPERVISOR', name: 'Kitchen Supervisor', description: 'Kitchen operations supervisor' },
    { code: 'KITCHEN_STAFF', name: 'Kitchen Staff', description: 'Kitchen staff member' },
    { code: 'DELIVERY_PARTNER', name: 'Delivery Partner', description: 'Delivery personnel' },
    { code: 'CUSTOMER', name: 'Customer', description: 'Standard customer account' }
];

export const seedRolesData = async () => {
    try {

        for (const roleData of seedRoles) {
            const exists = await Role.findOne({ code: roleData.code });
            if (!exists) {
                await Role.create({ ...roleData, isSystemRole: true });
                console.log(`Created role: ${roleData.code}`);
            } else {
                console.log(`Role already exists: ${roleData.code}`);
            }
        }

        console.log('Roles seeded successfully');

        const superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN' });
        if (superAdminRole) {
            const defaultEmail = 'superadmin@papavegpizza.com';
            const defaultMobile = '9999999999';

            let superadmin = await User.findOne({ email: defaultEmail });

            if (!superadmin) {
                console.log('No superadmin found. Creating default superadmin...');
                
                superadmin = await User.create({
                    email: defaultEmail,
                    mobile: defaultMobile,
                    password: 'SuperAdminPassword123!',
                    loginType: 'PASSWORD',
                    primaryRole: superAdminRole._id,
                    emailVerified: true,
                    mobileVerified: true
                });

                const profileExists = await Profile.findOne({ userId: superadmin._id });
                if (!profileExists) {
                    await Profile.create({
                        userId: superadmin._id,
                        firstName: 'Super',
                        lastName: 'Admin',
                        phone: defaultMobile
                    });
                }

                const userRoleExists = await UserRole.findOne({ userId: superadmin._id, roleId: superAdminRole._id });
                if (!userRoleExists) {
                    await UserRole.create({
                        userId: superadmin._id,
                        roleId: superAdminRole._id,
                        isPrimary: true
                    });
                }

                console.log('Default superadmin created:');
                console.log(`Email: ${defaultEmail}`);
                console.log('Password: SuperAdminPassword123!');
            } else {
                console.log('Superadmin already exists. Skipping creation to ensure single superadmin.');
            }
        }

        return true;
    } catch (error) {
        console.error('Error seeding roles:', error);
        return false;
    }
};

// If run directly
if (process.argv[1] && process.argv[1].endsWith('seed-roles.js')) {
    mongoose.connect(config.mongodbUri).then(() => {
        console.log('Connected to database');
        seedRolesData().then(() => process.exit(0));
    });
}
