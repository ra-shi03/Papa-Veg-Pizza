import { StoreManager } from '../models/storeManager.model.js';
import { uploadImageBuffer } from '../../../../services/cloudinary.service.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import bcrypt from 'bcryptjs';


export const createStoreManager = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.profileImage = await uploadImageBuffer(req.file.buffer, 'papa-veg/managers');
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

    const managers = await StoreManager.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: managers.length, data: managers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStoreManagerById = async (req, res) => {
  try {
    const manager = await StoreManager.findById(req.params.id);
    if (!manager) return res.status(404).json({ success: false, message: 'Not found' });
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

    const manager = await StoreManager.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!manager) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: manager });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStoreManager = async (req, res) => {
  try {
    const manager = await StoreManager.findByIdAndUpdate(req.params.id, { status: 'DELETED' }, { new: true });
    if (!manager) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
