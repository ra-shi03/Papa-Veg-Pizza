import { StoreManager } from '../models/storeManager.model.js';
import { uploadImageBuffer } from '../../../../services/cloudinary.service.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { assertPasswordStrength, generateTempPassword } from '../../../../utils/password.js';
import { findScopedStore, isSuperAdmin, scopedStoreIds } from '../../shared/franchiseScope.js';

// Managers are linked to a store (storeId is stored as a string); a franchise admin only sees
// managers of its own franchise's stores. Super admin: no restriction.
const managerScope = async (req) => {
  const storeIds = await scopedStoreIds(req);
  return storeIds === null ? {} : { storeId: { $in: storeIds.map(String) } };
};


// Fields a caller may set when creating a manager. userId, role, lastLoginAt and storeName are set by the
// server (storeName from the store record); profileImage only comes from the uploaded file.
const CREATABLE_MANAGER_FIELDS = [
  'name', 'email', 'phone', 'employeeCode', 'joinedDate', 'status', 'storeId',
  'reportingManager', 'personalDetails', 'address', 'emergencyContact', 'salary'
];

export const createStoreManager = async (req, res) => {
  try {
    const data = {};
    for (const field of CREATABLE_MANAGER_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    const password = req.body.password;
    if (req.file) {
      data.profileImage = await uploadImageBuffer(req.file.buffer, 'papa-veg/managers');
    }
    // The store must exist and belong to the caller's franchise (a franchise admin must pick one)
    if (data.storeId || !isSuperAdmin(req.user)) {
      const scopedStore = await findScopedStore(req, data.storeId, '_id franchiseId storeName');
      if (!scopedStore) {
        return res.status(400).json({ success: false, message: 'Choose a store from your franchise.' });
      }
      data.storeName = scopedStore.storeName || '';
    }
    // Validate store manager assignment
    if (data.storeId) {
      const existingManager = await StoreManager.findOne({ storeId: data.storeId, status: { $ne: 'DELETED' } });
      if (existingManager) {
        return res.status(400).json({ success: false, message: 'This store already has an assigned manager.' });
      }
    }
    
    // Parse nested objects if sent as flat strings from FormData
    if (typeof data.personalDetails === 'string') {
        data.personalDetails = JSON.parse(data.personalDetails);
    }
    // We don't need to parse permissions anymore

    // 1. Get or create STORE_MANAGER role
    let role = await Role.findOne({ code: 'STORE_MANAGER' });
    if (!role) {
      role = await Role.create({ code: 'STORE_MANAGER', name: 'Store Manager', description: 'Manages a specific store', isSystemRole: true });
    }

    // 2. Create User. An admin-chosen password must be at least 8 characters; without one a random
    // temporary password is generated and returned once in this response (only the hash is stored).
    let temporaryPassword = null;
    if (password) {
      assertPasswordStrength(password);
    } else {
      temporaryPassword = generateTempPassword();
    }
    const hashedPassword = await bcrypt.hash(password || temporaryPassword, 10);
    const user = await FoodUser.create({
      email: data.email,
      mobile: data.phone,
      password: hashedPassword,
      loginType: 'PASSWORD',
      primaryRole: role._id,
      isActive: data.status === 'Active'
    });

    // 3. Create Profile
    const nameParts = data.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    await Profile.create({
      userId: user._id,
      firstName,
      lastName,
      phone: data.phone,
      profilePhoto: data.profileImage || '',
      addressLine1: data.personalDetails?.address || ''
    });

    // 4. Create UserRole mapping (optional but recommended for RBAC)
    let franchiseId = null;
    if (data.storeId) {
      try {
        const FoodStore = mongoose.model('FoodStore');
        const store = await FoodStore.findById(data.storeId).lean();
        if (store && store.franchiseId) {
          franchiseId = store.franchiseId;
        }
      } catch (e) {
        // ignore if not found
      }
      
      await UserRole.create({
        userId: user._id,
        roleId: role._id,
        storeId: data.storeId,
        franchiseId: franchiseId,
        isPrimary: true,
        status: 'ACTIVE'
      });
    }

    // 5. Create StoreManager record
    data.userId = user._id;
    data.role = 'Store Manager';
    if (data.address || data.emergencyContact || data.salary) {
      data.personalDetails = {
        address: data.address || data.personalDetails?.address || '',
        emergencyContact: data.emergencyContact || data.personalDetails?.emergencyContact || '',
        salary: Number(data.salary) || Number(data.personalDetails?.salary) || 0
      };
    }
    const storeManager = new StoreManager(data);
    const savedManager = await storeManager.save();
    
    res.status(201).json({
      success: true,
      data: temporaryPassword ? { ...savedManager.toObject(), temporaryPassword } : savedManager
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStoreManagers = async (req, res) => {
  try {
    const { status, storeId, search } = req.query;
    let query = { status: { $ne: 'DELETED' } };
    const scope = await managerScope(req);
    
    if (status && status !== 'All') query.status = status;
    if (storeId && storeId !== 'All') query.storeId = storeId;
    if (scope.storeId) {
      // A ?storeId= outside the caller's franchise matches nothing
      const allowed = scope.storeId.$in;
      query.storeId = query.storeId ? { $in: allowed.filter((id) => id === String(query.storeId)) } : { $in: allowed };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    let managers = await StoreManager.find(query).sort({ createdAt: -1 }).lean();
    
    const storeIds = managers.map(m => m.storeId).filter(id => id && id.length === 24);
    if (storeIds.length > 0) {
      const stores = await mongoose.model('FoodStore').find({ _id: { $in: storeIds }, approvalStatus: 'Approved' })
        .populate('franchiseId', 'name ownerName companyName')
        .lean();
        
      managers = managers.filter(m => {
        if (!m.storeId) return true; // Keep managers without a store
        const store = stores.find(s => s._id.toString() === m.storeId);
        if (store) {
          m.storeName = store.storeName;
          m.storeCode = store.code;
          m.storeAddress = store.address;
          m.storeEmail = store.email || "Not Available";
          m.franchiseName = store.franchiseId?.name || store.franchiseId?.companyName || 'Unknown';
          m.franchiseOwnerName = store.franchiseId?.ownerName || 'Unknown';
          return true;
        }
        return false; // Store is pending/unapproved
      });
    }

    res.status(200).json({ success: true, count: managers.length, data: managers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStoreManagerById = async (req, res) => {
  try {
    const manager = await StoreManager.findOne({ _id: req.params.id, ...(await managerScope(req)) }).lean();
    if (!manager) return res.status(404).json({ success: false, message: 'Not found' });

    if (manager.storeId) {
      const store = await mongoose.model('FoodStore').findById(manager.storeId).populate('franchiseId', 'name ownerName companyName').lean();
      if (store) {
        manager.storeName = store.storeName;
        manager.storeCode = store.code;
        manager.storeAddress = store.address;
        manager.storeEmail = store.email || "Not Available";
        manager.franchiseName = store.franchiseId?.name || store.franchiseId?.companyName || 'Unknown';
        manager.franchiseOwnerName = store.franchiseId?.ownerName || 'Unknown';
      }
    }

    res.status(200).json({ success: true, data: manager });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fields a caller may change on a store manager. userId, role, lastLoginAt and timestamps are
// system-managed; address/emergencyContact/salary are folded into personalDetails below.
const UPDATABLE_MANAGER_FIELDS = [
  'name', 'email', 'phone', 'employeeCode', 'joinedDate', 'status', 'storeId', 'storeName',
  'reportingManager', 'profileImage', 'personalDetails', 'permissions',
  'address', 'emergencyContact', 'salary'
];

export const updateStoreManager = async (req, res) => {
  try {
    const data = {};
    for (const field of UPDATABLE_MANAGER_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    if (req.file) {
      data.profileImage = await uploadImageBuffer(req.file.buffer, 'papa-veg/managers');
    }

    if (typeof data.personalDetails === 'string') {
        data.personalDetails = JSON.parse(data.personalDetails);
    }
    if (typeof data.permissions === 'string') {
        data.permissions = JSON.parse(data.permissions);
    }
    
    if (data.address || data.emergencyContact || data.salary) {
      data.personalDetails = {
        address: data.address || data.personalDetails?.address || '',
        emergencyContact: data.emergencyContact || data.personalDetails?.emergencyContact || '',
        salary: Number(data.salary) || Number(data.personalDetails?.salary) || 0
      };
    }

    if (data.storeId !== undefined && !(await findScopedStore(req, data.storeId))) {
      return res.status(400).json({ success: false, message: 'Choose a store from your franchise.' });
    }

    const manager = await StoreManager.findOneAndUpdate({ _id: req.params.id, ...(await managerScope(req)) }, data, {
      new: true,
      runValidators: true,
    });
    if (!manager) return res.status(404).json({ success: false, message: 'Not found' });

    if (data.status && manager.userId) {
      await FoodUser.findByIdAndUpdate(manager.userId, {
        isActive: data.status === 'Active'
      });
    }

    // Sync UserRole if storeId was updated
    if (data.storeId && manager.userId) {
      let franchiseId = null;
      try {
        const FoodStore = mongoose.model('FoodStore');
        const store = await FoodStore.findById(data.storeId).lean();
        if (store && store.franchiseId) {
          franchiseId = store.franchiseId;
        }
      } catch (e) {
        // ignore
      }
      
      await UserRole.findOneAndUpdate(
        { userId: manager.userId, isPrimary: true },
        { $set: { storeId: data.storeId, franchiseId: franchiseId } }
      );
    }

    res.status(200).json({ success: true, data: manager });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStoreManager = async (req, res) => {
  try {
    const manager = await StoreManager.findOne({ _id: req.params.id, ...(await managerScope(req)) });
    if (!manager) return res.status(404).json({ success: false, message: 'Not found' });

    // Hard Delete associated user records
    if (manager.userId) {
      await FoodUser.findByIdAndDelete(manager.userId);
      await Profile.findOneAndDelete({ userId: manager.userId });
      await UserRole.findOneAndDelete({ userId: manager.userId });
    }
    
    await StoreManager.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
