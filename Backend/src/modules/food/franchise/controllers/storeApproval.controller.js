import { FoodStore } from '../../store/models/store.model.js';
import { StoreManager } from '../models/storeManager.model.js';

// Get store approvals list for franchise admin
export const getStoreApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'All', city = '', sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = { franchiseId: req.user?.franchiseId || req.user?._id || '60d5ecb8b392d7001f3e7943' };
    
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
      return {
        ...store,
        status: store.approvalStatus,
        managerName: manager ? manager.personalDetails?.firstName + ' ' + manager.personalDetails?.lastName : 'Not Assigned',
        phone: manager ? manager.personalDetails?.phone : store.phone,
        email: manager ? manager.personalDetails?.email : store.email,
        documents: [] // Mocked for now
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
    const franchiseId = req.user?.franchiseId || req.user?._id || '60d5ecb8b392d7001f3e7943';
    
    const [draft, pending, approved, rejected] = await Promise.all([
      FoodStore.countDocuments({ franchiseId, approvalStatus: 'Draft' }),
      FoodStore.countDocuments({ franchiseId, approvalStatus: 'Pending' }),
      FoodStore.countDocuments({ franchiseId, approvalStatus: 'Approved' }),
      FoodStore.countDocuments({ franchiseId, approvalStatus: 'Rejected' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        draftStores: draft,
        pendingApprovals: pending,
        approvedStores: approved,
        rejectedStores: rejected,
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
    
    if (store.approvalStatus !== 'Draft' && store.approvalStatus !== 'Rejected') {
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
