import { FoodStore } from '../../store/models/store.model.js';
import { StoreManager } from '../models/storeManager.model.js';
import '../../admin/models/region.model.js';
import '../../admin/models/zone.model.js';
import '../../admin/models/territory.model.js';
import sharp from 'sharp';
import { uploadImageBuffer, uploadFileBuffer } from '../../../../services/cloudinary.service.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { Role } from '../../../../core/roles/models/role.model.js';
import { UserRole } from '../../../../core/roles/models/userRole.model.js';
import bcrypt from 'bcryptjs';

// Get store approvals list for franchise admin
export const getStoreApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'All', city = '', sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query - allow Superadmin to see all franchises
    const query = {};
    const userRole = String(req.user?.role || '').toUpperCase().replace(/_/g, '-');
    if (userRole !== 'SUPER-ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      query.franchiseId = req.user?.franchiseId || req.user?._id || '60d5ecb8b392d7001f3e7943';
    }
    
    if (status && status !== 'All') {
      query.approvalStatus = status;
    }
    
    if (city && city !== 'All') {
      query.city = city;
    }
    
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination & Sort
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    console.log("getStoreApprovals query:", query);

    const stores = await FoodStore.find(query)
      .populate('franchiseId')
      .populate('regionId')
      .populate('zoneId')
      .populate({
        path: 'territoryId',
        populate: {
          path: 'zoneId',
          populate: { path: 'regionId' }
        }
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();
      
    const totalCount = await FoodStore.countDocuments(query);
    console.log("getStoreApprovals totalCount:", totalCount);
    
    // Attach manager details
    const storeIds = stores.map(s => s._id);
    const managers = await StoreManager.find({ storeId: { $in: storeIds } }).lean();
    
    const approvals = stores.map(store => {
      const manager = managers.find(m => m.storeId.toString() === store._id.toString());
      
      const mappedZone = store.zoneId || store.territoryId?.zoneId || null;
      const mappedRegion = store.regionId || mappedZone?.regionId || null;
      
      return {
        ...store,
        franchiseName: store.franchiseId?.companyName || store.franchiseId?.name || 'N/A',
        regionId: mappedRegion,
        zoneId: mappedZone,
        status: store.approvalStatus,
        managerId: manager ? manager._id : null,
        managerName: manager ? (manager.name || 'Not Assigned') : 'Not Assigned',
        phone: manager ? manager.phone : store.phone,
        email: manager ? manager.email : store.email,
        documents: store.documents || []
      };
    });

    res.status(200).json({
      success: true,
      data: {
        approvals,
        totalCount,
        page: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Dashboard KPIs
export const getStoreApprovalsDashboard = async (req, res) => {
  try {
    const query = {};
    const userRole = String(req.user?.role || '').toUpperCase().replace(/_/g, '-');
    if (userRole !== 'SUPER-ADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      query.franchiseId = req.user?.franchiseId || req.user?._id || '60d5ecb8b392d7001f3e7943';
    }
    
    const [draft, pending, approved, rejected, changesRequested] = await Promise.all([
      FoodStore.countDocuments({ ...query, approvalStatus: 'Draft' }),
      FoodStore.countDocuments({ ...query, approvalStatus: 'Pending' }),
      FoodStore.countDocuments({ ...query, approvalStatus: 'Approved' }),
      FoodStore.countDocuments({ ...query, approvalStatus: 'Rejected' }),
      FoodStore.countDocuments({ ...query, approvalStatus: 'Changes Requested' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        draftStores: draft,
        pendingApprovals: pending,
        approvedStores: approved,
        rejectedStores: rejected,
        changesRequestedStores: changesRequested,
        avgApprovalTime: "24.5" // Mock for now
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit for Approval
export const submitStoreApproval = async (req, res) => {
  try {
    const storeId = req.params.id;
    const store = await FoodStore.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    if (store.approvalStatus !== 'Draft' && store.approvalStatus !== 'Rejected' && store.approvalStatus !== 'Changes Requested') {
      return res.status(400).json({ success: false, message: `Cannot submit store with status ${store.approvalStatus}` });
    }
    
    store.approvalStatus = 'Pending';
    store.submittedAt = new Date();
    await store.save();
    
    res.status(200).json({
      success: true,
      message: 'Store submitted for approval successfully',
      data: store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload documents for store approval
export const uploadStoreDocuments = async (req, res) => {
  try {
    const storeId = req.params.id;
    const store = await FoodStore.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (!req.files || (Array.isArray(req.files) ? req.files.length === 0 : Object.keys(req.files).length === 0)) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    const uploadedDocs = [];

    for (const file of req.files) {
      const mimeType = String(file.mimetype || '').toLowerCase();
      const originalName = String(file.originalname || '');
      const docType = file.fieldname;
      let url = '';
      
      if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
        url = await uploadFileBuffer(file.buffer, 'store_approvals/documents', {
          fileName: originalName,
          format: 'pdf'
        });
      } else if (mimeType.startsWith('image/')) {
        const compressedBuffer = await sharp(file.buffer)
          .webp({ quality: 80 })
          .toBuffer();
          
        url = await uploadImageBuffer(compressedBuffer, 'store_approvals/documents');
      } else {
        continue;
      }
      
      uploadedDocs.push({
        type: docType,
        name: originalName,
        url: url,
        uploadedAt: new Date()
      });
    }

    const existingDocs = store.documents || [];
    const mergedDocs = [...existingDocs];
    
    uploadedDocs.forEach(newDoc => {
      const existingIndex = mergedDocs.findIndex(d => d.type === newDoc.type);
      if (existingIndex >= 0) {
        mergedDocs[existingIndex] = newDoc;
      } else {
        mergedDocs.push(newDoc);
      }
    });

    store.documents = mergedDocs;
    await store.save();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: store.documents
    });
  } catch (error) {
    console.error("Error uploading store documents:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveStoreApproval = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { adminName, adminEmail, adminPhone, franchiseName } = req.body;
    
    const store = await FoodStore.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    store.approvalStatus = 'Approved';
    store.isActive = true;
    store.approvedAt = new Date();
    await store.save();
    
    // Create Manager and User if credentials provided
    if (adminName && adminEmail && adminPhone) {
      // 1. Get or create STORE_MANAGER role
      let role = await Role.findOne({ code: 'STORE_MANAGER' });
      if (!role) {
        role = await Role.create({ code: 'STORE_MANAGER', name: 'Store Manager', description: 'Manages a specific store', isSystemRole: true });
      }

      // 2. Create User
      const existingUser = await FoodUser.findOne({ email: adminEmail });
      let user = existingUser;
      if (!user) {
        const hashedPassword = await bcrypt.hash('12345678', 10);
        user = await FoodUser.create({
          email: adminEmail,
          mobile: adminPhone,
          password: hashedPassword,
          primaryRole: role._id,
          isActive: true
        });
      }

      // 3. Create Profile if new user
      if (!existingUser) {
        const nameParts = adminName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        await Profile.create({
          userId: user._id,
          firstName,
          lastName,
          phone: adminPhone,
          profilePhoto: '',
          addressLine1: ''
        });
      }

      // 4. Create UserRole mapping
      let userRole = await UserRole.findOne({ userId: user._id, storeId: store._id });
      if (!userRole) {
        const hasPrimary = await UserRole.exists({ userId: user._id, isPrimary: true, status: 'ACTIVE' });
        await UserRole.create({
          userId: user._id,
          storeId: store._id,
          roleId: role._id,
          isPrimary: !hasPrimary
        });
      } else {
        userRole.roleId = role._id;
        await userRole.save();
      }

      // 5. Create StoreManager record
      const existingManager = await StoreManager.findOne({ storeId: store._id, status: { $ne: 'DELETED' } });
      if (!existingManager) {
        const employeeCode = `EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await StoreManager.create({
          userId: user._id,
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          employeeCode,
          status: 'Active',
          storeId: store._id.toString()
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Store approved successfully',
      data: store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectStoreApproval = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { reason, notes } = req.body;
    const store = await FoodStore.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    store.approvalStatus = 'Rejected';
    store.rejectionReason = reason;
    store.rejectionNotes = notes;
    await store.save();
    
    res.status(200).json({
      success: true,
      message: 'Store rejected successfully',
      data: store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestChangesStoreApproval = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { instructions, notes, deadline } = req.body;
    const store = await FoodStore.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    store.approvalStatus = 'Changes Requested';
    store.changesInstructions = instructions;
    store.changesNotes = notes;
    if (deadline) store.changesDeadline = new Date(deadline);
    await store.save();
    
    res.status(200).json({
      success: true,
      message: 'Changes requested successfully',
      data: store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyDocument = async (req, res) => {
  try {
    const storeId = req.params.id;
    const documentId = req.params.docId;
    
    const store = await FoodStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    const doc = store.documents.id(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    doc.isVerified = !doc.isVerified; // Toggle verification status
    await store.save();
    
    res.status(200).json({
      success: true,
      message: 'Document verification status updated',
      data: store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
