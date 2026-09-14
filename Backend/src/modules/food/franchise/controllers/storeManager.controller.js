import { StoreManager } from '../models/storeManager.model.js';
import { uploadImage } from '../../../../services/cloudinary.service.js';

export const createStoreManager = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const uploadResult = await uploadImage(req.file.buffer, { folder: 'papa-veg/managers' });
      data.profileImage = uploadResult.secure_url;
    }
    
    // Parse nested objects if sent as flat strings from FormData
    if (typeof data.personalDetails === 'string') {
        data.personalDetails = JSON.parse(data.personalDetails);
    }
    if (typeof data.permissions === 'string') {
        data.permissions = JSON.parse(data.permissions);
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
      const uploadResult = await uploadImage(req.file.buffer, { folder: 'papa-veg/managers' });
      data.profileImage = uploadResult.secure_url;
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
