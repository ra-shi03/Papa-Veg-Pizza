import { StoreManager } from '../models/storeManager.model.js';
import { uploadImageBuffer } from '../../../../services/cloudinary.service.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';


export const createStoreManager = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.profileImage = await uploadImageBuffer(req.file.buffer, 'papa-veg/managers');
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

    // 2. Create User
    const hashedPassword = await bcrypt.hash(data.password || '12345678', 10);
    const user = await FoodUser.create({
      email: data.email,
      mobile: data.phone,
      password: hashedPassword,
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
    if (data.storeId) {
      await UserRole.create({
        userId: user._id,
        roleId: role._id,
        storeId: data.storeId,
        isPrimary: true
      });
    }

    // 5. Create StoreManager record
    data.userId = user._id;
    if (data.address || data.emergencyContact || data.salary) {
      data.personalDetails = {
        address: data.address || data.personalDetails?.address || '',
        emergencyContact: data.emergencyContact || data.personalDetails?.emergencyContact || '',
        salary: Number(data.salary) || Number(data.personalDetails?.salary) || 0
      };
    }
    const storeManager = new StoreManager(data);
    const savedManager = await storeManager.save();
    
    res.status(201).json({ success: true, data: savedManager });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStoreManagers = async (req, res) => {
  try {
    const { status, storeId, search } = req.query;
    let query = { status: { $ne: 'DELETED' } };
    
    if (status && status !== 'All') query.status = status;
    if (storeId && storeId !== 'All') query.storeId = storeId;
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
    const manager = await StoreManager.findById(req.params.id).lean();
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

export const updateStoreManager = async (req, res) => {
  try {
    const data = { ...req.body };
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

    const manager = await StoreManager.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!manager) return res.status(404).json({ success: false, message: 'Not found' });

    if (data.status && manager.userId) {
      await FoodUser.findByIdAndUpdate(manager.userId, {
        isActive: data.status === 'Active'
      });
    }

    res.status(200).json({ success: true, data: manager });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStoreManager = async (req, res) => {
  try {
    const manager = await StoreManager.findById(req.params.id);
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
