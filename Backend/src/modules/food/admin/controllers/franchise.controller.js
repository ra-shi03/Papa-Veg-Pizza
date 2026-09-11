import mongoose from 'mongoose';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { User } from '../../../../core/users/models/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

// ─── Create Franchise + Franchise Admin ──────────────────────────────────────
// This is the critical production-level flow. All 4 operations run inside
// a MongoDB transaction — if any step fails, everything is rolled back
// atomically. No orphan documents, no partial state.
//
// Creates:
//   1. food_franchises  — business entity
//   2. users            — authentication account (email + mobile + hashed password)
//   3. profiles         — personal information (firstName, lastName, phone)
//   4. userRoles        — connects user → FRANCHISE_ADMIN role → franchise
export const createFranchise = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const {
                name,           // Owner's full name e.g. "Anchal Singh"
                email,          // Login email for franchise admin
                phone,          // Login mobile for franchise admin
                password,       // Initial password
                franchiseName,  // Business name e.g. "Papa Veg Pizza Sector 10"
                franchiseCode,
                regionId,
                zoneId,
                territoryId,
                city,
                state,
                type,
                totalStores,
                status,
                franchiseDuration,
                franchiseCost,
                paidAmount,
                dueAmount,
                gstNumber,
                panNumber,
                address,
                pincode
            } = req.body;

            // ── Validation ─────────────────────────────────────────────────
            if (!name || !email || !phone || !password || !franchiseName || !franchiseCode) {
                throw Object.assign(new Error('Required fields are missing: name, email, phone, password, franchiseName, franchiseCode'), { statusCode: 400 });
            }

            if (String(password).length < 8) {
                throw Object.assign(new Error('Password must be at least 8 characters'), { statusCode: 400 });
            }

            const normalizedEmail = String(email).trim().toLowerCase();
            const normalizedPhone = String(phone).trim();
            const normalizedCode  = String(franchiseCode).trim().toUpperCase();

            // ── Uniqueness Checks (before opening transaction writes) ───────
            const [existingUser, existingPhone, existingCode] = await Promise.all([
                User.findOne({ email: normalizedEmail, isDeleted: false }).select('_id').lean(),
                User.findOne({ mobile: normalizedPhone, isDeleted: false }).select('_id').lean(),
                FoodFranchise.findOne({ franchiseCode: normalizedCode }).select('_id').lean()
            ]);

            if (existingUser)  throw Object.assign(new Error('An account with this email already exists'), { statusCode: 409 });
            if (existingPhone) throw Object.assign(new Error('An account with this phone already exists'), { statusCode: 409 });
            if (existingCode)  throw Object.assign(new Error('Franchise code already in use'), { statusCode: 409 });

            // ── Fetch the FRANCHISE_ADMIN role from DB ─────────────────────
            const franchiseAdminRole = await Role.findOne({ code: 'FRANCHISE_ADMIN' }).lean();
            if (!franchiseAdminRole) {
                throw Object.assign(
                    new Error('FRANCHISE_ADMIN role not found. Please run seed-roles.js first.'),
                    { statusCode: 500 }
                );
            }

            // ── Step 1: Create User (authentication account) ───────────────
            const [newUser] = await User.create([{
                email: normalizedEmail,
                mobile: normalizedPhone,
                password,                   // pre-save hook hashes this
                loginType: 'PASSWORD',
                primaryRole: franchiseAdminRole._id,
                emailVerified: false,
                mobileVerified: false,
                isActive: status !== 'INACTIVE',
                isBlocked: false,
                isDeleted: false
            }], { session });

            // ── Step 2: Create Profile (personal data) ─────────────────────
            // Split the owner name into firstName + lastName
            const nameParts = String(name || '').trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName  = nameParts.slice(1).join(' ') || '';

            await Profile.create([{
                userId: newUser._id,
                firstName,
                lastName,
                phone: normalizedPhone,
                country: 'India',
                timezone: 'Asia/Kolkata',
                language: 'en'
            }], { session });

            // ── Step 3: Create Franchise (business entity) ────────────────
            const [newFranchise] = await FoodFranchise.create([{
                name: String(franchiseName || '').trim(),
                ownerName: String(name || '').trim(),
                email: normalizedEmail,
                phone: normalizedPhone,
                gstNumber,
                panNumber,
                address,
                pincode,
                franchiseCode: normalizedCode,
                regionId,
                zoneId,
                territoryId,
                city,
                state,
                type,
                totalStores,
                franchiseDuration,
                franchiseCost,
                paidAmount,
                dueAmount,
                isActive: status !== 'INACTIVE',
                ownerUserId: newUser._id,
                createdBy: req.user?.userId || null
            }], { session });

            // ── Step 4: Create UserRole (authorization link) ───────────────
            // This is the critical connection: User → FRANCHISE_ADMIN → Franchise
            await UserRole.create([{
                userId: newUser._id,
                roleId: franchiseAdminRole._id,
                franchiseId: newFranchise._id,
                storeId: null,
                assignedBy: req.user?.userId || null,
                assignedAt: new Date(),
                isPrimary: true,
                status: 'ACTIVE'
            }], { session });

            result = {
                franchise: {
                    _id: newFranchise._id,
                    name: newFranchise.name,
                    franchiseCode: newFranchise.franchiseCode,
                    ownerName: newFranchise.ownerName,
                    isActive: newFranchise.isActive
                },
                admin: {
                    _id: newUser._id,
                    email: newUser.email,
                    mobile: newUser.mobile,
                    role: 'franchise-admin',
                    // Never expose the password hash in response
                }
            };
        });

        return sendResponse(res, 201, 'Franchise and admin account created successfully', result);

    } catch (error) {
        console.error('[createFranchise] Error:', error.message);
        const status = error.statusCode || 500;
        return sendError(res, status, error.message || 'Failed to create franchise');
    } finally {
        session.endSession();
    }
};

// ─── List Franchises ─────────────────────────────────────────────────────────
export const getFranchises = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status === 'ACTIVE')   filter.isActive = true;
        if (req.query.status === 'INACTIVE') filter.isActive = false;

        const franchises = await FoodFranchise.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Frontend expects a flat array here
        return sendResponse(res, 200, 'Franchises fetched successfully', franchises);
    } catch (error) {
        console.error('[getFranchises] Error:', error.message);
        return sendError(res, 500, 'Failed to fetch franchises', error.message);
    }
};

// ─── Get Single Franchise ────────────────────────────────────────────────────
export const getFranchiseById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid franchise ID');
        }

        const franchise = await FoodFranchise.findById(id)
            .populate('ownerUserId', 'email mobile isActive lastLoginAt')
            .lean();

        if (!franchise) {
            return sendError(res, 404, 'Franchise not found');
        }

        return sendResponse(res, 200, 'Franchise fetched successfully', franchise);
    } catch (error) {
        console.error('[getFranchiseById] Error:', error.message);
        return sendError(res, 500, 'Failed to fetch franchise', error.message);
    }
};

// ─── Get My Franchise (Franchise Admin) ──────────────────────────────────────
// The logged-in franchise admin calls this to get their own franchise data.
// Lookup: FoodFranchise.ownerUserId === req.user._id
export const getMyFranchise = async (req, res) => {
    try {
        // Auth middleware sets req.user.userId (from JWT decoded.userId)
        const userId = req.user?.userId;
        if (!userId) {
            return sendError(res, 401, 'Not authenticated');
        }

        // Also fetch their profile for personal info fields
        const [franchise, profile] = await Promise.all([
            FoodFranchise.findOne({ ownerUserId: userId }).lean(),
            Profile.findOne({ userId }).lean()
        ]);

        if (!franchise) {
            return sendError(res, 404, 'No franchise linked to your account');
        }

        // Merge profile data so one API call returns everything the profile page needs
        return sendResponse(res, 200, 'My franchise fetched successfully', {
            franchise,
            profile: profile || null
        });
    } catch (error) {
        console.error('[getMyFranchise] Error:', error.message);
        return sendError(res, 500, 'Failed to fetch franchise', error.message);
    }
};

// ─── Update My Franchise Profile (Franchise Admin self-service) ──────────────
// Allows the franchise admin to update their own profile fields (city, state, pincode, address)
// Read-only fields (name, email, phone, gstNumber, franchiseCode, etc.) are managed by SuperAdmin only.
export const updateMyFranchise = async (req, res) => {
    try {
        // Auth middleware sets req.user.userId (from JWT decoded.userId)
        const userId = req.user?.userId;
        if (!userId) {
            return sendError(res, 401, 'Not authenticated');
        }

        const franchise = await FoodFranchise.findOne({ ownerUserId: userId });
        if (!franchise) {
            return sendError(res, 404, 'No franchise linked to your account');
        }

        // Only allow franchise admin to update their personal profile fields — not core business fields
        const allowedProfileFields = ['city', 'state', 'pincode', 'address'];
        const updates = {};
        allowedProfileFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = String(req.body[field]).trim();
            }
        });

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        Object.assign(franchise, updates);
        await franchise.save();

        return sendResponse(res, 200, 'Profile updated successfully', franchise.toObject());
    } catch (error) {
        console.error('[updateMyFranchise] Error:', error.message);
        return sendError(res, 500, 'Failed to update franchise profile', error.message);
    }
};



// ─── Update Franchise ────────────────────────────────────────────────────────
export const updateFranchise = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid franchise ID');
        }

        let updatedFranchise;

        await session.withTransaction(async () => {
            const updates = { ...req.body };

            // Normalize status field
            if (updates.status !== undefined) {
                updates.isActive = updates.status === 'ACTIVE';
                delete updates.status;
            }

            // Never allow overwriting ownerUserId or createdBy via patch
            delete updates.ownerUserId;
            delete updates.createdBy;

            // Map frontend specific names to Franchise schema
            if (updates.name !== undefined) {
                updates.ownerName = updates.name;
            }
            if (updates.franchiseName !== undefined) {
                updates.name = updates.franchiseName;
                delete updates.franchiseName;
            }

            // Extract password to update User, prevent writing to Franchise
            let passwordUpdate = null;
            if (updates.password) {
                passwordUpdate = updates.password;
            }
            delete updates.password;

            updatedFranchise = await FoodFranchise.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: true, session }
            );

            if (!updatedFranchise) {
                throw Object.assign(new Error('Franchise not found'), { statusCode: 404 });
            }

            // Sync User and Profile records for the Franchise Admin
            if (updatedFranchise.ownerUserId) {
                const userId = updatedFranchise.ownerUserId;
                
                // 1. Update User (auth)
                const userUpdates = {};
                if (updates.email) userUpdates.email = String(updates.email).trim().toLowerCase();
                if (updates.phone) userUpdates.mobile = String(updates.phone).trim();
                if (updates.isActive !== undefined) userUpdates.isActive = updates.isActive;
                
                if (Object.keys(userUpdates).length > 0) {
                    await User.updateOne({ _id: userId }, { $set: userUpdates }, { session });
                }

                // If password was updated, use save() to trigger bcrypt hash hook
                if (passwordUpdate) {
                    const userDoc = await User.findById(userId).session(session);
                    if (userDoc) {
                        userDoc.password = passwordUpdate;
                        await userDoc.save({ session });
                    }
                }

                // 2. Update Profile (personal data)
                const profileUpdates = {};
                if (updates.ownerName) {
                    const nameParts = String(updates.ownerName || '').trim().split(/\s+/);
                    profileUpdates.firstName = nameParts[0] || '';
                    profileUpdates.lastName = nameParts.slice(1).join(' ') || '';
                }
                if (updates.phone) profileUpdates.phone = String(updates.phone).trim();
                
                if (Object.keys(profileUpdates).length > 0) {
                    await Profile.updateOne({ userId }, { $set: profileUpdates }, { session });
                }

                // 3. Sync UserRole status if isActive changed
                if (updates.isActive !== undefined) {
                    const newRoleStatus = updates.isActive ? 'ACTIVE' : 'SUSPENDED';
                    await UserRole.updateMany(
                        { franchiseId: id },
                        { $set: { status: newRoleStatus } },
                        { session }
                    );
                }
            }
        });

        return sendResponse(res, 200, 'Franchise updated successfully', updatedFranchise);
    } catch (error) {
        console.error('[updateFranchise] Error:', error.message);
        const status = error.statusCode || 500;
        return sendError(res, status, error.message || 'Failed to update franchise');
    } finally {
        session.endSession();
    }
};

// ─── Delete Franchise (Soft Delete) ─────────────────────────────────────────
// Senior note: We never hard-delete franchise data in production.
// Financial records (franchiseCost, paidAmount, dueAmount) must be preserved
// for audit purposes. We soft-delete the auth accounts and revoke roles.
export const deleteFranchise = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid franchise ID');
        }

        await session.withTransaction(async () => {
            const franchise = await FoodFranchise.findById(id).select('ownerUserId').lean();
            if (!franchise) {
                throw Object.assign(new Error('Franchise not found'), { statusCode: 404 });
            }

            // 1. Soft-delete the franchise record
            await FoodFranchise.findByIdAndUpdate(
                id,
                { $set: { isActive: false } },
                { session }
            );

            // 2. Revoke all userRoles linked to this franchise
            await UserRole.updateMany(
                { franchiseId: id },
                { $set: { status: 'REMOVED' } },
                { session }
            );

            // 3. Soft-delete the owner User account
            if (franchise.ownerUserId) {
                await User.updateOne(
                    { _id: franchise.ownerUserId },
                    { $set: { isActive: false, isDeleted: true } },
                    { session }
                );
            }
        });

        return sendResponse(res, 200, 'Franchise deactivated successfully');
    } catch (error) {
        console.error('[deleteFranchise] Error:', error.message);
        const status = error.statusCode || 500;
        return sendError(res, status, error.message || 'Failed to delete franchise');
    } finally {
        session.endSession();
    }
};
