/**
 * migrate-food-admins.js
 *
 * ONE-TIME migration script.
 * Copies all existing food_admins documents into the production schema:
 *   users + profiles + userRoles
 *
 * After successful migration, drops the food_admins collection permanently.
 *
 * Usage:
 *   node migrate-food-admins.js
 *
 * Safe to run multiple times — skips accounts that already exist in `users`.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './src/config/env.js';

// ─── Models ───────────────────────────────────────────────────────────────────
import { User }      from './src/core/users/models/user.model.js';
import { Profile }   from './src/core/users/models/profile.model.js';
import { Role }      from './src/core/roles/models/role.model.js';
import { UserRole }  from './src/core/roles/models/userRole.model.js';
import { FoodFranchise } from './src/modules/food/franchise/models/franchise.model.js';

// ─── Role code mapping from food_admins.role → roles.code ────────────────────
const ROLE_MAP = {
    'superadmin':           'SUPER_ADMIN',
    'franchise-admin':      'FRANCHISE_ADMIN',
    'store-manager':        'STORE_MANAGER',
    'kitchen-supervisor':   'KITCHEN_SUPERVISOR',
    'kitchen-staff':        'KITCHEN_STAFF',
};

async function run() {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log(  '║     Papa Veg Pizza — food_admins Migration Script    ║');
    console.log(  '╚══════════════════════════════════════════════════════╝\n');

    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to database:', config.mongodbUri.split('@').pop());

    // Check if food_admins collection exists
    const collections = await mongoose.connection.db.listCollections({ name: 'food_admins' }).toArray();
    if (collections.length === 0) {
        console.log('\n⚠️  food_admins collection does not exist. Nothing to migrate.');
        await mongoose.disconnect();
        return;
    }

    // Fetch all non-deleted food_admins
    const rawAdmins = await mongoose.connection.db
        .collection('food_admins')
        .find({ isDeleted: { $ne: true } })
        .toArray();

    console.log(`📋 Found ${rawAdmins.length} admin(s) in food_admins to migrate.\n`);

    if (rawAdmins.length === 0) {
        await dropCollection();
        return;
    }

    // Pre-fetch all roles into a map for O(1) lookup
    const allRoles = await Role.find().lean();
    const roleByCode = {};
    for (const r of allRoles) {
        roleByCode[r.code] = r;
    }

    let migrated   = 0;
    let skipped    = 0;
    let errors     = 0;

    for (const admin of rawAdmins) {
        const label = `[${admin.email || admin._id}]`;

        try {
            const normalizedEmail  = String(admin.email  || '').trim().toLowerCase();
            const normalizedMobile = String(admin.phone || admin.mobile || '').trim();

            // ── Skip check: already in users? ──────────────────────────────
            const existing = await User.findOne({ email: normalizedEmail, isDeleted: false })
                .select('_id')
                .lean();

            if (existing) {
                console.log(`  ⏭  ${label} — Already in users collection. Skipping.`);
                skipped++;
                continue;
            }

            // ── Determine role ──────────────────────────────────────────────
            const adminRoleStr = String(admin.role || 'superadmin').toLowerCase();
            const roleCode     = ROLE_MAP[adminRoleStr] || 'SUPER_ADMIN';
            const roleDoc      = roleByCode[roleCode];

            if (!roleDoc) {
                console.error(`  ❌ ${label} — Role "${roleCode}" not found in DB. Run seed-roles.js first.`);
                errors++;
                continue;
            }

            // If mobile is missing, generate a placeholder to satisfy the unique required field.
            // The admin can update it later.
            const mobile = normalizedMobile || `MIGRATE-${admin._id.toString()}`;

            // ── Step 1: Create User ─────────────────────────────────────────
            // We copy the hashed password directly — no re-hashing needed
            // because bcrypt hashes are portable and self-describing.
            const newUser = new User({
                email:          normalizedEmail   || undefined,
                mobile,
                loginType:      'PASSWORD',
                primaryRole:    roleDoc._id,
                emailVerified:  true,
                mobileVerified: !!normalizedMobile,
                isActive:       admin.isActive !== false,
                isBlocked:      false,
                isDeleted:      false,
                lastLoginAt:    admin.lastLogin || null,
            });

            // Bypass the pre-save hashing hook by directly setting the already-hashed password
            newUser.$locals = { skipPasswordHash: true };
            if (admin.password) {
                // Direct assignment bypasses the pre('save') hook's isModified check
                newUser.password = admin.password;
            }
            await newUser.save();

            // ── Step 2: Create Profile ──────────────────────────────────────
            const nameParts = String(admin.name || '').trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName  = nameParts.slice(1).join(' ') || '';

            await Profile.create({
                userId:    newUser._id,
                firstName,
                lastName,
                phone:     normalizedMobile || '',
                country:   'India',
                timezone:  'Asia/Kolkata',
                language:  'en',
            });

            // ── Step 3: Create UserRole ─────────────────────────────────────
            // For franchise admins: try to find their franchise
            let franchiseId = admin.franchiseId || null;
            if (!franchiseId && normalizedEmail && adminRoleStr === 'franchise-admin') {
                const franchise = await FoodFranchise.findOne({ email: normalizedEmail }).select('_id').lean();
                if (franchise) franchiseId = franchise._id;
            }

            await UserRole.create({
                userId:      newUser._id,
                roleId:      roleDoc._id,
                franchiseId: franchiseId || null,
                storeId:     admin.storeId || null,
                assignedBy:  null,
                assignedAt:  admin.createdAt || new Date(),
                isPrimary:   true,
                status:      admin.isActive !== false ? 'ACTIVE' : 'SUSPENDED',
            });

            // ── Step 4: Update FoodFranchise.ownerUserId if franchise admin ─
            if (franchiseId) {
                await FoodFranchise.updateOne(
                    { _id: franchiseId },
                    { $set: { ownerUserId: newUser._id } }
                );
            }

            console.log(`  ✅ ${label} → Migrated as ${roleCode} (userId: ${newUser._id})`);
            migrated++;

        } catch (err) {
            console.error(`  ❌ ${label} — Migration failed: ${err.message}`);
            errors++;
        }
    }

    console.log('\n─────────────────────────────────────────────────────');
    console.log(`  Migrated : ${migrated}`);
    console.log(`  Skipped  : ${skipped} (already existed in users)`);
    console.log(`  Errors   : ${errors}`);
    console.log('─────────────────────────────────────────────────────\n');

    if (errors > 0) {
        console.error(`⛔ ${errors} error(s) occurred. Dropping food_admins is SKIPPED for safety.`);
        console.error('   Fix the errors above and re-run this script.\n');
    } else {
        await dropCollection();
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected. Migration complete.\n');
}

async function dropCollection() {
    try {
        await mongoose.connection.db.collection('food_admins').drop();
        console.log('🗑️  food_admins collection has been permanently deleted.\n');
    } catch (err) {
        if (err.message.includes('ns not found')) {
            console.log('ℹ️  food_admins already dropped or does not exist.\n');
        } else {
            throw err;
        }
    }
}

run().catch((err) => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
});
