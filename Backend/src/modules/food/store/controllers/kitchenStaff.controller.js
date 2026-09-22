import { FoodUser } from '../../../../core/users/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Role code → DB role mapping for kitchen staff
const ALLOWED_STAFF_ROLES = {
  'Kitchen Supervisor': 'KITCHEN_SUPERVISOR',
  'Kitchen Staff': 'KITCHEN_STAFF',
  'Pizza Maker': 'KITCHEN_STAFF',
  'Baker': 'KITCHEN_STAFF',
  'Packager': 'KITCHEN_STAFF',
};

/**
 * POST /v1/food/store/staff
 * Create a new kitchen staff member.
 * Saves in: users + profiles + userRoles + storemanagers
 * Caller must be a logged-in store manager (role: STORE_MANAGER).
 */
export const createKitchenStaff = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      fullName, email, phone, password, role: staffRole,
      employeeId, joiningDate, salaryType, salary, experience,
      emergencyContact, address, skills, weeklyWorkingDays,
      shiftType, startTime, endTime, status, profileImage,
    } = req.body;

    const callerStoreId = req.user?.storeId;
    const callerFranchiseId = req.user?.franchiseId;
    const callerUserId = req.user?.userId;

    if (!fullName || !email || !phone || !password) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Full name, email, phone, and password are required.' });
    }

    if (!callerStoreId) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'You are not assigned to a store.' });
    }

    const roleCode = ALLOWED_STAFF_ROLES[staffRole] || 'KITCHEN_STAFF';

    // Check duplicate email in users collection
    const existingUser = await FoodUser.findOne({ email: email.toLowerCase().trim() }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    // Check duplicate mobile
    const existingMobile = await FoodUser.findOne({ mobile: phone.trim() }).session(session);
    if (existingMobile) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: 'A user with this phone number already exists.' });
    }

    // Ensure role exists in the roles collection
    let roleDoc = await Role.findOne({ code: roleCode }).session(session);
    if (!roleDoc) {
      roleDoc = await Role.create([{
        code: roleCode,
        name: staffRole || roleCode,
        description: `Kitchen staff role: ${staffRole}`,
        isSystemRole: true,
      }], { session });
      roleDoc = roleDoc[0];
    }

    // Hash password since the model no longer auto-hashes
    const hashedPassword = await bcrypt.hash(password, 12);

    // Step 1: Create User record
    const [newUser] = await FoodUser.create([{
      email: email.toLowerCase().trim(),
      mobile: phone.trim(),
      password: hashedPassword,
      loginType: 'PASSWORD',
      primaryRole: roleDoc._id,
      emailVerified: true,
      mobileVerified: true,
      isActive: (status || 'Active') === 'Active',
    }], { session });

    // Step 2: Create Profile record
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    await Profile.create([{
      userId: newUser._id,
      firstName,
      lastName,
      phone: phone.trim(),
      addressLine1: address || '',
    }], { session });

    // Step 3: Create UserRole mapping (RBAC — links user to store)
    await UserRole.create([{
      userId: newUser._id,
      roleId: roleDoc._id,
      storeId: callerStoreId,
      franchiseId: callerFranchiseId || null,
      assignedBy: callerUserId || null,
      isPrimary: true,
      status: 'ACTIVE',
    }], { session });
    
    // Resolve reporting manager name
    let reportingManagerName = null;
    if (callerUserId) {
        const callerManager = await StoreManager.findOne({ userId: callerUserId }).session(session).lean();
        if (callerManager) {
            reportingManagerName = callerManager.name;
        }
    }

    // Step 4: Create StoreManager/Staff operational record
    const employeeCode = employeeId || `PVK-${Date.now().toString().slice(-6)}`;

    const [newStoreManager] = await StoreManager.create([{
      userId: newUser._id,
      name: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role: staffRole,
      employeeCode,
      storeId: callerStoreId,
      joinedDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: status || 'Active',
      profileImage: profileImage || '',
      reportingManager: reportingManagerName,
      personalDetails: {
        address: address || '',
        emergencyContact: emergencyContact || '',
        salary: Number(salary) || 0,
        salaryType: salaryType || 'Monthly',
        experience: Number(experience) || 0,
        shiftType: shiftType || 'Morning',
        startTime: startTime || '',
        endTime: endTime || '',
        skills: skills || [],
        weeklyWorkingDays: weeklyWorkingDays || [],
      },
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: `${staffRole || 'Kitchen staff'} registered successfully.`,
      data: newStoreManager,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `Duplicate value: ${field} already exists.` });
    }

    console.error('[createKitchenStaff]', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create staff member.' });
  }
};

/**
 * GET /v1/food/store/staff
 * List all kitchen staff for the logged-in store manager's store.
 */
export const getKitchenStaff = async (req, res) => {
  try {
    const callerStoreId = req.user?.storeId;
    if (!callerStoreId) {
      return res.status(403).json({ success: false, message: 'Not assigned to a store.' });
    }

    const { search, status } = req.query;
    const query = { 
      storeId: callerStoreId, 
      status: { $ne: 'DELETED' },
      userId: { $ne: req.user.userId } // Exclude the Store Manager themselves
    }; 
    console.log("getKitchenStaff Query:", query);

    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const staff = await StoreManager.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Attach store and franchise names
    let storeName = null;
    let franchiseName = null;
    try {
      const FoodStore = mongoose.model('FoodStore');
      const store = await FoodStore.findById(callerStoreId).lean();
      if (store) {
        storeName = store.storeName || store.name;
        if (store.franchiseId) {
          const FoodFranchise = mongoose.model('FoodFranchise');
          const franchise = await FoodFranchise.findById(store.franchiseId).lean();
          if (franchise) {
            franchiseName = franchise.name || franchise.companyName;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching store/franchise names:', e);
    }

    const enhancedStaff = staff.map(s => ({
      ...s,
      storeName: storeName || s.storeName,
      franchiseName: franchiseName || s.franchiseName
    }));

    return res.status(200).json({ success: true, data: enhancedStaff });
  } catch (err) {
    console.error('[getKitchenStaff]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /v1/food/store/staff/:id
 * Get a single staff member by ID (must belong to the caller's store).
 */
export const getKitchenStaffById = async (req, res) => {
  try {
    const callerStoreId = req.user?.storeId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid staff ID.' });
    }

    const staff = await StoreManager.findOne({ _id: id, storeId: callerStoreId, status: { $ne: 'DELETED' } }).lean();
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Attach user email/mobile from users collection
    if (staff.userId) {
      const user = await FoodUser.findById(staff.userId).select('email mobile').lean();
      if (user) { staff.userEmail = user.email; staff.userMobile = user.mobile; }
    }

    // Attach store and franchise names
    try {
      const FoodStore = mongoose.model('FoodStore');
      const store = await FoodStore.findById(staff.storeId).lean();
      if (store) {
        staff.storeName = store.storeName || store.name || staff.storeName;
        if (store.franchiseId) {
          const FoodFranchise = mongoose.model('FoodFranchise');
          const franchise = await FoodFranchise.findById(store.franchiseId).lean();
          if (franchise) {
            staff.franchiseName = franchise.name || franchise.companyName || staff.franchiseName;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching store/franchise names:', e);
    }

    return res.status(200).json({ success: true, data: staff });
  } catch (err) {
    console.error('[getKitchenStaffById]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /v1/food/store/staff/:id
 * Update staff profile (name, phone, role, salary, shift, skills, etc.).
 */
export const updateKitchenStaff = async (req, res) => {
  try {
    const callerStoreId = req.user?.storeId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid staff ID.' });
    }

    const staff = await StoreManager.findOne({ _id: id, storeId: callerStoreId, status: { $ne: 'DELETED' } });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const { fullName, phone, role, joiningDate, salaryType, salary, experience, skills, emergencyContact, address, shiftType, status, profileImage } = req.body;

    if (fullName) staff.name = fullName.trim();
    if (phone) staff.phone = phone.trim();
    if (role) staff.role = role.trim();
    if (joiningDate) staff.joinedDate = new Date(joiningDate);
    if (status && status !== 'DELETED') staff.status = status;
    if (profileImage) staff.profileImage = profileImage;
    if (shiftType) staff.personalDetails = { ...staff.personalDetails?.toObject?.() || staff.personalDetails || {}, shiftType };
    if (salary !== undefined || salaryType || emergencyContact || address || experience !== undefined || skills) {
      staff.personalDetails = {
        ...staff.personalDetails?.toObject?.() || staff.personalDetails || {},
        ...(salary !== undefined && { salary: Number(salary) }),
        ...(salaryType && { salaryType }),
        ...(emergencyContact && { emergencyContact }),
        ...(address && { address }),
        ...(experience !== undefined && { experience: Number(experience) }),
        ...(skills && { skills }),
      };
    }

    await staff.save();

    // Sync name/phone to profile and role to UserRole if userId exists
    if (staff.userId) {
      const nameParts = (fullName || staff.name).split(' ');
      await Profile.findOneAndUpdate(
        { userId: staff.userId },
        { $set: { firstName: nameParts[0], lastName: nameParts.slice(1).join(' '), ...(phone && { phone }) } }
      );
      
      if (role) {
        const ALLOWED_STAFF_ROLES = {
          'Kitchen Supervisor': 'KITCHEN_SUPERVISOR',
          'Pizza Maker': 'KITCHEN_STAFF',
          'Baker': 'KITCHEN_STAFF',
          'Packager': 'KITCHEN_STAFF',
        };
        const roleCode = ALLOWED_STAFF_ROLES[role.trim()] || 'KITCHEN_STAFF';
        const roleDoc = await Role.findOne({ code: roleCode });
        
        if (roleDoc) {
          await UserRole.findOneAndUpdate(
            { userId: staff.userId, storeId: callerStoreId },
            { $set: { roleId: roleDoc._id } }
          );
          await FoodUser.findOneAndUpdate(
            { _id: staff.userId },
            { $set: { primaryRole: roleDoc._id } }
          );
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Staff profile updated.', data: staff });
  } catch (err) {
    console.error('[updateKitchenStaff]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /v1/food/store/staff/:id/status
 * Activate or deactivate a staff member.
 * Body: { status: 'Active' | 'Inactive' | 'Suspended' }
 */
export const updateStaffStatus = async (req, res) => {
  try {
    const callerStoreId = req.user?.storeId;
    const { id } = req.params;
    const { status } = req.body;

    const VALID = ['Active', 'Inactive', 'Suspended', 'On Leave'];
    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${VALID.join(', ')}` });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid staff ID.' });
    }

    const staff = await StoreManager.findOneAndUpdate(
      { _id: id, storeId: callerStoreId, status: { $ne: 'DELETED' } },
      { $set: { status } },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Also sync isActive on the user record
    if (staff.userId) {
      await FoodUser.findByIdAndUpdate(staff.userId, { $set: { isActive: status === 'Active' } });
    }

    return res.status(200).json({ success: true, message: `Staff status updated to "${status}".`, data: staff });
  } catch (err) {
    console.error('[updateStaffStatus]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /v1/food/store/staff/:id/shift
 * Assign a shift to a staff member.
 * Body: { shiftId: 'Morning' | 'Afternoon' | 'Evening' | 'Night', effectiveDate? }
 */
export const assignShift = async (req, res) => {
  try {
    const callerStoreId = req.user?.storeId;
    const { id } = req.params;
    const { shiftId, shiftType, startTime, endTime, effectiveDate } = req.body;

    const shiftValue = shiftId || shiftType;
    if (!shiftValue) {
      return res.status(400).json({ success: false, message: 'shiftId is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid staff ID.' });
    }

    const staff = await StoreManager.findOne({ _id: id, storeId: callerStoreId, status: { $ne: 'DELETED' } });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    staff.personalDetails = {
      ...staff.personalDetails?.toObject?.() || staff.personalDetails || {},
      shiftType: shiftValue,
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(effectiveDate && { shiftEffectiveDate: effectiveDate }),
    };

    await staff.save();
    return res.status(200).json({ success: true, message: `Shift "${shiftValue}" assigned.`, data: staff });
  } catch (err) {
    console.error('[assignShift]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /v1/food/store/staff/:id/leave
 * Mark leave for a staff member.
 * Body: { leaveType, startDate, endDate, reason? }
 */
export const markLeave = async (req, res) => {
  try {
    const callerStoreId = req.user?.storeId;
    const { id } = req.params;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'leaveType, startDate, and endDate are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid staff ID.' });
    }

    const staff = await StoreManager.findOneAndUpdate(
      { _id: id, storeId: callerStoreId, status: { $ne: 'DELETED' } },
      { $set: { status: 'On Leave' } },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Leave marked: ${leaveType} from ${startDate} to ${endDate}.`,
      data: { ...staff.toObject(), leave: { leaveType, startDate, endDate, reason } },
    });
  } catch (err) {
    console.error('[markLeave]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /v1/food/store/staff/:id
 * Soft-delete a staff member (sets status to DELETED, deactivates user).
 */
export const deleteKitchenStaff = async (req, res) => {
  try {
    const callerStoreId = req.user?.storeId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid staff ID.' });
    }

    const staff = await StoreManager.findOneAndDelete({ _id: id, storeId: callerStoreId });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Hard delete the associated user account, profile, and RBAC role
    if (staff.userId) {
      await FoodUser.findByIdAndDelete(staff.userId);
      await Profile.findOneAndDelete({ userId: staff.userId });
      await UserRole.findOneAndDelete({ userId: staff.userId, storeId: callerStoreId });
    }

    return res.status(200).json({ success: true, message: 'Staff member hard deleted successfully.' });
  } catch (err) {
    console.error('[deleteKitchenStaff]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
