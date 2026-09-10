import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { FoodAdmin } from '../../../../core/admin/admin.model.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

export const createFranchise = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            franchiseName,
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
            address
        } = req.body;

        // Validation
        if (!name || !email || !phone || !password || !franchiseName || !franchiseCode) {
            return sendError(res, 400, 'Required fields are missing');
        }

        // Check if admin email exists
        const existingAdmin = await FoodAdmin.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (existingAdmin) {
            return sendError(res, 400, 'Admin email already exists');
        }

        // Check if franchise code exists
        const existingCode = await FoodFranchise.findOne({ franchiseCode });
        if (existingCode) {
            return sendError(res, 400, 'Franchise code already exists');
        }

        // Create franchise
        const newFranchise = await FoodFranchise.create({
            name: franchiseName,
            ownerName: name,
            email: email.toLowerCase(),
            phone,
            gstNumber,
            address,
            franchiseCode,
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
            isActive: status === 'ACTIVE',
            createdBy: req.user?._id || null
        });

        // Create franchise admin
        const newAdmin = await FoodAdmin.create({
            email: email.toLowerCase(),
            password,
            name,
            phone,
            role: 'franchise-admin',
            franchiseId: newFranchise._id,
            isActive: status === 'ACTIVE',
            createdBy: req.user?._id || null
        });

        return sendResponse(res, 201, 'Franchise and admin created successfully', {
            franchise: newFranchise,
            admin: {
                _id: newAdmin._id,
                email: newAdmin.email,
                name: newAdmin.name,
                role: newAdmin.role
            }
        });
    } catch (error) {
        console.error('Error creating franchise:', error);
        return sendError(res, 500, 'Failed to create franchise', error.message);
    }
};

export const getFranchises = async (req, res) => {
    try {
        const franchises = await FoodFranchise.find().sort({ createdAt: -1 });
        return sendResponse(res, 200, 'Franchises fetched successfully', franchises);
    } catch (error) {
        console.error('Error fetching franchises:', error);
        return sendError(res, 500, 'Failed to fetch franchises', error.message);
    }
};

export const getFranchiseById = async (req, res) => {
    try {
        const { id } = req.params;
        const franchise = await FoodFranchise.findById(id);
        if (!franchise) {
            return sendError(res, 404, 'Franchise not found');
        }
        return sendResponse(res, 200, 'Franchise fetched successfully', franchise);
    } catch (error) {
        console.error('Error fetching franchise:', error);
        return sendError(res, 500, 'Failed to fetch franchise', error.message);
    }
};

export const updateFranchise = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // If status is toggled (from frontend it sends status: "ACTIVE" or "INACTIVE")
        if (updates.status !== undefined) {
            updates.isActive = updates.status === 'ACTIVE';
            delete updates.status;
        }

        const updatedFranchise = await FoodFranchise.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedFranchise) {
            return sendError(res, 404, 'Franchise not found');
        }

        // Keep Admin account in sync if active status changes
        if (updates.isActive !== undefined) {
            await FoodAdmin.updateMany(
                { franchiseId: id },
                { $set: { isActive: updates.isActive } }
            );
        }

        return sendResponse(res, 200, 'Franchise updated successfully', updatedFranchise);
    } catch (error) {
        console.error('Error updating franchise:', error);
        return sendError(res, 500, 'Failed to update franchise', error.message);
    }
};

export const deleteFranchise = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedFranchise = await FoodFranchise.findByIdAndDelete(id);
        if (!deletedFranchise) {
            return sendError(res, 404, 'Franchise not found');
        }

        // Also delete associated admins
        await FoodAdmin.deleteMany({ franchiseId: id });

        return sendResponse(res, 200, 'Franchise deleted successfully');
    } catch (error) {
        console.error('Error deleting franchise:', error);
        return sendError(res, 500, 'Failed to delete franchise', error.message);
    }
};
