import { FoodUser } from '../../../../core/users/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import { FoodRefreshToken as RefreshToken } from '../../../../core/refreshTokens/refreshToken.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import mongoose from 'mongoose';
import { escapeRegex } from '../../../../utils/helpers.js';
import { kitchenStaffFilter, KITCHEN_STAFF_KIND } from '../services/kitchenStaffDirectory.js';

// Kitchen staff are staff records the store manager runs from the store panel: no email needed, no password, no login
// (client decision 2026-11-26, docs/kitchen-staff-removal.md). The franchise admin still approves a new record before the
// manager can put the person on a station. The kitchen supervisor role is no longer used: asking for it is a 400.
const SUPERVISOR_REFUSED = 'The kitchen supervisor role is no longer used. Add the person as kitchen staff (Pizza Maker, Baker or Packager).';
const isSupervisorTitle = (title) => /supervisor/i.test(String(title || ''));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s]{7,15}$/;

/**
 * The staff a store manager may look at and change: the kitchen staff of the manager's own store (and the
 * deactivated records of former kitchen supervisors, which are kept, never deleted), never the manager themselves and
 * never another manager of the store (their records sit in the same store).
 */
async function manageableStaff(req, extra = {}) {
  const kitchen = await kitchenStaffFilter([req.user.storeId], { retired: true });
  return { $and: [kitchen, { storeId: String(req.user.storeId), userId: { $ne: req.user.userId ? new mongoose.Types.ObjectId(String(req.user.userId)) : null } }, extra] };
}

/**
 * POST /v1/food/store/staff
 * Adds a kitchen staff member: one staff record, no login (any email / password sent by an older screen is not used to
 * make an account). Waits as 'Pending Approval' until the franchise admin approves it.
 * Caller must be a logged-in store manager (role: STORE_MANAGER).
 */
export const createKitchenStaff = async (req, res) => {
  try {
    const {
      fullName, email, phone, role: staffRole,
      employeeId, joiningDate, salaryType, salary, experience,
      emergencyContact, address, skills, weeklyWorkingDays,
      shiftType, startTime, endTime, profileImage,
    } = req.body;

    const callerStoreId = req.user?.storeId;
    const callerUserId = req.user?.userId;

    const name = String(fullName || '').trim();
    const mobile = String(phone || '').trim();
    const mail = String(email || '').trim().toLowerCase();
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Full name and phone are required.' });
    }
    if (!PHONE_RE.test(mobile)) return res.status(400).json({ success: false, message: 'Enter a valid phone number.' });
    if (mail && !EMAIL_RE.test(mail)) return res.status(400).json({ success: false, message: 'Enter a valid email address, or leave it empty.' });
    if (isSupervisorTitle(staffRole)) {
      return res.status(400).json({ success: false, message: SUPERVISOR_REFUSED });
    }
    if (!callerStoreId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to a store.' });
    }

    // the same phone twice in one store is almost always the same person added again
    if (await StoreManager.exists({ storeId: String(callerStoreId), phone: mobile, status: { $nin: ['DELETED', 'Rejected'] } })) {
      return res.status(409).json({ success: false, message: 'A staff member with this phone number already exists in your store.' });
    }

    const callerManager = callerUserId ? await StoreManager.findOne({ userId: callerUserId }).select('name').lean() : null;
    const employeeCode = String(employeeId || '').trim() || `PVK-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    const record = await StoreManager.create({
      staffKind: KITCHEN_STAFF_KIND,
      userId: null,
      name,
      ...(mail ? { email: mail } : {}),
      phone: mobile,
      role: String(staffRole || 'Kitchen Staff').trim(),
      employeeCode,
      storeId: String(callerStoreId),
      joinedDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: 'Pending Approval',
      profileImage: profileImage || '',
      reportingManager: callerManager?.name || null,
      personalDetails: {
        address: address || '',
        emergencyContact: emergencyContact || '',
        salary: Number(salary) || 0,
        salaryType: salaryType || 'Monthly',
        experience: Number(experience) || 0,
        shiftType: shiftType || 'Morning',
        startTime: startTime || '',
        endTime: endTime || '',
        skills: Array.isArray(skills) ? skills : [],
        weeklyWorkingDays: Array.isArray(weeklyWorkingDays) ? weeklyWorkingDays : [],
      },
    });

    return res.status(201).json({
      success: true,
      message: `${record.role} added. You can put them on stations once the franchise admin approves.`,
      data: record,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ success: false, message: field === 'email' ? 'A staff member with this email already exists.' : `Duplicate value: ${field} already exists.` });
    }
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors || {})[0]?.message || err.message });
    console.error('[createKitchenStaff]', err);
    return res.status(500).json({ success: false, message: 'Failed to add the staff member.' });
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
    // Kitchen staff of this store only: not the manager, not other managers
    const query = await manageableStaff(req, { status: { $ne: 'DELETED' } });

    if (status && status !== 'All') query.status = status;
    if (search) {
      const rx = escapeRegex(search);
      query.$or = [
        { name: { $regex: rx, $options: 'i' } },
        { email: { $regex: rx, $options: 'i' } },
        { employeeCode: { $regex: rx, $options: 'i' } },
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
      fullName: s.name,   // the attendance and shift screens look people up by fullName
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

    const staff = await StoreManager.findOne(await manageableStaff(req, { _id: id, status: { $ne: 'DELETED' } })).lean();
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
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

    const staff = await StoreManager.findOne(await manageableStaff(req, { _id: id, status: { $ne: 'DELETED' } }));
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const { fullName, email, phone, role, joiningDate, salaryType, salary, experience, skills, emergencyContact, address, shiftType, status, profileImage } = req.body;

    if (isSupervisorTitle(role)) return res.status(400).json({ success: false, message: SUPERVISOR_REFUSED });
    // A former kitchen supervisor stays deactivated: the record is kept for history but never switched back on
    if (isSupervisorTitle(staff.role) && status === 'Active') {
      return res.status(400).json({ success: false, message: 'This former kitchen supervisor account is deactivated. Add the person again as kitchen staff.' });
    }

    if (fullName) staff.name = fullName.trim();
    if (phone) staff.phone = phone.trim();
    // email is optional for kitchen staff (no login); an empty value removes it
    if (email !== undefined) {
      const mail = String(email || '').trim().toLowerCase();
      if (mail && !EMAIL_RE.test(mail)) return res.status(400).json({ success: false, message: 'Enter a valid email address, or leave it empty.' });
      staff.email = mail || undefined;
    }
    if (role) staff.role = role.trim();
    if (joiningDate) staff.joinedDate = new Date(joiningDate);
    // Approval is the franchise admin's call: nobody waiting for it (or turned down) can be activated from here
    if (status && status !== 'DELETED' && !['Pending Approval', 'Rejected'].includes(staff.status) && !['Pending Approval', 'Rejected'].includes(status)) staff.status = status;
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

    // a record from before the change is marked as kitchen staff on its first edit (its old login stays switched off)
    if (!staff.staffKind && !isSupervisorTitle(staff.role)) staff.staffKind = KITCHEN_STAFF_KIND;
    try {
      await staff.save();
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ success: false, message: 'A staff member with this email already exists.' });
      throw err;
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

    // A former kitchen supervisor stays deactivated: the record is kept for history but never switched back on
    const notRetired = status === 'Active' ? { role: { $not: /supervisor/i } } : {};
    const staff = await StoreManager.findOneAndUpdate(
      await manageableStaff(req, { _id: id, status: { $nin: ['DELETED', 'Pending Approval', 'Rejected'] }, ...notRetired }),
      { $set: { status } },
      { new: true }
    );

    if (!staff) {
      if (status === 'Active' && await StoreManager.exists(await manageableStaff(req, { _id: id, role: /supervisor/i }))) {
        return res.status(400).json({ success: false, message: 'This former kitchen supervisor account is deactivated. Add the person again as kitchen staff.' });
      }
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // (kitchen staff have no login: a pre-change account stays switched off whatever the status)

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

    const staff = await StoreManager.findOne(await manageableStaff(req, { _id: id, status: { $ne: 'DELETED' } }));
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

    const staff = await StoreManager.findOneAndDelete(await manageableStaff(req, { _id: id }));

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // A record from before kitchen staff lost their logins: remove its old (switched off) account too
    if (staff.userId) {
      await FoodUser.findByIdAndDelete(staff.userId);
      await Profile.findOneAndDelete({ userId: staff.userId });
      await UserRole.findOneAndDelete({ userId: staff.userId, storeId: callerStoreId });
      await RefreshToken.deleteMany({ userId: staff.userId }).catch(() => {});
    }

    return res.status(200).json({ success: true, message: 'Staff member hard deleted successfully.' });
  } catch (err) {
    console.error('[deleteKitchenStaff]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
