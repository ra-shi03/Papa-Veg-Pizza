import { FoodStore } from '../../store/models/store.model.js';
import { FoodFranchise } from '../models/franchise.model.js';
import { StoreManager } from '../models/storeManager.model.js';
import { FoodRegion } from '../../admin/models/region.model.js';
import { FoodZone } from '../../admin/models/zone.model.js';
import mongoose from 'mongoose';

const formatStoreResponse = (store, fallbackOwnerName = 'Unknown') => {
  if (!store) return store;
  if (!store.regionId) delete store.regionId;
  if (!store.zoneId) delete store.zoneId;
  store.franchiseOwnerName = store.franchiseId?.ownerName || fallbackOwnerName;
  store.franchiseName = store.franchiseId?.name || store.franchiseId?.companyName || 'Unknown';
  store.franchiseEmail = store.franchiseId?.email || '';
  store.franchisePhone = store.franchiseId?.phone || '';
  store.franchiseRegion = store.franchiseId?.regionId || '';
  store.franchiseZone = store.franchiseId?.zoneId || '';
  store.createdBy = store.franchiseOwnerName;
  store.franchiseId = store.franchiseId?._id || store.franchiseId;
  return store;
};

const getFallbackOwner = async (req) => {
  let franchise;
  if (req.user?.franchiseId) {
    franchise = await FoodFranchise.findById(req.user.franchiseId).lean();
  }
  if (!franchise) {
    franchise = await FoodFranchise.findOne().lean();
  }
  return franchise?.ownerName || 'Unknown';
};

export const createStore = async (req, res) => {
  try {
    const {
      storeName, storeCode, phone, email, address, status, 
      storeType, fulfillmentModes, territoryId, zoneId, regionId
    } = req.body;

    // Map frontend structure to backend schema
    const newStoreData = {
      franchiseId: req.user?.franchiseId || req.user?._id || '60d5ecb8b392d7001f3e7943', // Default mock if no auth
      storeName: storeName,
      code: storeCode,
      phone: phone,
      email: email,
      address: address?.line1 || '',
      city: address?.city || '',
      state: address?.state || '',
      pincode: address?.pincode || '',
      latitude: address?.coordinates ? address.coordinates[1] : null,
      longitude: address?.coordinates ? address.coordinates[0] : null,
      isActive: status === 'Active',
      storeType: storeType || 'DELIVERY_CARRYOUT',
      fulfillmentModes: fulfillmentModes || [],
      territoryId: territoryId || null,
      zoneId: zoneId || null,
      regionId: regionId || null
    };

    const store = new FoodStore(newStoreData);
    await store.save();
    const savedStore = await FoodStore.findById(store._id)
      .populate('regionId zoneId territoryId', 'name')
      .populate('franchiseId', 'ownerName')
      .lean();
    
    const fallbackOwner = await getFallbackOwner(req);
    res.status(201).json({ success: true, data: formatStoreResponse(savedStore, fallbackOwner) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStores = async (req, res) => {
  try {
    const { status, city, search, type } = req.query;
    let query = { status: { $ne: 'DELETED' }, approvalStatus: 'Approved' }; // Ensure only approved stores are fetched
    
    if (status && status !== 'All') {
      query.isActive = status === 'Active';
    }
    if (type && type !== 'All') query.storeType = type;
    if (city && city !== 'All') query.city = city;
    
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    let stores = await FoodStore.find(query)
      .populate('regionId zoneId territoryId', 'name')
      .populate('franchiseId', 'ownerName name companyName')
      .sort({ createdAt: -1 })
      .lean();
      
    const storeIds = stores.map(s => s._id);
    const managers = await StoreManager.find({ storeId: { $in: storeIds }, status: { $ne: 'DELETED' } }).lean();
      
    const fallbackOwner = await getFallbackOwner(req);
    stores = stores.map(s => {
      const manager = managers.find(m => m.storeId?.toString() === s._id.toString());
      s.managerName = manager ? manager.name : null;
      return formatStoreResponse(s, fallbackOwner);
    });
    
    res.status(200).json({ 
      success: true, 
      data: {
        stores,
        totalCount: stores.length
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: req.params.id } 
      : { code: req.params.id };

    const store = await FoodStore.findOne(query)
      .populate('regionId zoneId territoryId', 'name')
      .populate('franchiseId', 'ownerName name companyName email phone regionId zoneId')
      .lean();
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    // Fetch manager details
    const manager = await StoreManager.findOne({ storeId: store._id, status: { $ne: 'DELETED' } }).lean();
    store.managerName = manager ? manager.name : 'Not Assigned';
    store.managerPhone = manager ? manager.phone : '';
    store.managerEmail = manager ? manager.email : '';
    
    // Convert franchise region and zone IDs to names
    if (store.franchiseId?.regionId && mongoose.Types.ObjectId.isValid(store.franchiseId.regionId)) {
       const region = await FoodRegion.findById(store.franchiseId.regionId).lean();
       if (region) store.franchiseId.regionId = region.name || store.franchiseId.regionId;
    }
    if (store.franchiseId?.zoneId && mongoose.Types.ObjectId.isValid(store.franchiseId.zoneId)) {
       const zone = await FoodZone.findById(store.franchiseId.zoneId).lean();
       if (zone) store.franchiseId.zoneId = zone.name || zone.zoneName || store.franchiseId.zoneId;
    }
    
    const fallbackOwner = await getFallbackOwner(req);
    res.status(200).json({ success: true, data: formatStoreResponse(store, fallbackOwner) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStore = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Map frontend structure to backend schema for update
    if (req.body.address && typeof req.body.address === 'object') {
      updateData.address = req.body.address.line1 || '';
      updateData.city = req.body.address.city || '';
      updateData.state = req.body.address.state || '';
      updateData.pincode = req.body.address.pincode || '';
      if (req.body.address.coordinates) {
        updateData.longitude = req.body.address.coordinates[0];
        updateData.latitude = req.body.address.coordinates[1];
      }
    }
    
    if (req.body.storeCode !== undefined) {
      updateData.code = req.body.storeCode;
      delete updateData.storeCode;
    }
    
    if (req.body.status !== undefined) {
      updateData.isActive = req.body.status === 'Active';
      delete updateData.status;
    }

    const query = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id }
      : { code: req.params.id };

    const store = await FoodStore.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('regionId zoneId territoryId', 'name')
      .populate('franchiseId', 'ownerName')
      .lean();
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    const fallbackOwner = await getFallbackOwner(req);
    res.status(200).json({ success: true, data: formatStoreResponse(store, fallbackOwner) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteStore = async (req, res) => {
  try {
    // Hard delete
    const query = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id }
      : { code: req.params.id };
    const store = await FoodStore.findOneAndDelete(query);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardKpis = async (req, res) => {
  try {
    const totalStores = await FoodStore.countDocuments({ status: { $ne: 'DELETED' } });
    const activeStores = await FoodStore.countDocuments({ status: 'Active' });
    const suspendedStores = await FoodStore.countDocuments({ status: 'Suspended' });
    
    res.status(200).json({
      success: true,
      data: {
        totalStores,
        activeStores,
        suspendedStores
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
