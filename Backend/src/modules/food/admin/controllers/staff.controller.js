import { FoodAdmin } from '../../../../core/admin/admin.model.js';
import mongoose from 'mongoose';

export const createStaff = async (req, res, next) => {
    try {
        const creatorRole = req.user.role; // e.g. superadmin, franchise-admin, store-manager
        const { email, password, name, phone, mobile, role, franchiseId, storeId } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
        }

        // Validate allowed role creation
        if (creatorRole === 'superadmin') {
            if (role !== 'franchise-admin') {
                return res.status(403).json({ success: false, message: 'Super admin can only create franchise admins.' });
            }
        } else if (creatorRole === 'franchise-admin') {
            if (role !== 'store-manager') {
                return res.status(403).json({ success: false, message: 'Franchise admin can only create store managers.' });
            }
        } else if (creatorRole === 'store-manager') {
            if (role !== 'kitchen-staff' && role !== 'kitchen-supervisor') {
                return res.status(403).json({ success: false, message: 'Store managers can only create kitchen staff or kitchen supervisors.' });
            }
        } else {
            return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to create staff.' });
        }

        // Check if email already exists
        const existing = await FoodAdmin.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Admin user with this email already exists.' });
        }

        const newStaff = await FoodAdmin.create({
            email: email.toLowerCase(),
            password, // will be hashed automatically by pre-save hook
            name,
            phone,
            mobile,
            role,
            franchiseId: franchiseId || req.user.franchiseId || null,
            storeId: storeId || req.user.storeId || null,
            createdBy: req.user.userId,
            emailVerified: true,
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: 'Staff user created successfully',
            data: {
                id: newStaff._id,
                email: newStaff.email,
                name: newStaff.name,
                role: newStaff.role
            }
        });
    } catch (err) {
        next(err);
    }
};

export const getStaffList = async (req, res, next) => {
    try {
        const creatorRole = req.user.role;
        let filter = { isDeleted: false };

        if (creatorRole === 'franchise-admin') {
            filter.role = 'store-manager';
        } else if (creatorRole === 'store-manager') {
            filter.role = { $in: ['kitchen-staff', 'kitchen-supervisor'] };
        }

        const staffList = await FoodAdmin.find(filter).select('-password').lean();
        return res.status(200).json({ success: true, data: staffList });
    } catch (err) {
        next(err);
    }
};

export const updateStaff = async (req, res, next) => {
    try {
        const creatorRole = req.user.role;
        const { id } = req.params;
        const { name, phone, mobile, isActive } = req.body;

        const staff = await FoodAdmin.findById(id);
        if (!staff || staff.isDeleted) {
            return res.status(404).json({ success: false, message: 'Staff user not found.' });
        }

        // Check permission to update
        if (creatorRole === 'franchise-admin' && staff.role !== 'store-manager') {
            return res.status(403).json({ success: false, message: 'You can only update store managers.' });
        }
        if (creatorRole === 'store-manager' && staff.role !== 'kitchen-staff' && staff.role !== 'kitchen-supervisor') {
            return res.status(403).json({ success: false, message: 'You can only update kitchen staff or supervisors.' });
        }

        if (name !== undefined) staff.name = name;
        if (phone !== undefined) staff.phone = phone;
        if (mobile !== undefined) staff.mobile = mobile;
        if (isActive !== undefined) staff.isActive = isActive;

        await staff.save();
        return res.status(200).json({ success: true, message: 'Staff updated successfully', data: staff });
    } catch (err) {
        next(err);
    }
};

export const deleteStaff = async (req, res, next) => {
    try {
        const creatorRole = req.user.role;
        const { id } = req.params;

        const staff = await FoodAdmin.findById(id);
        if (!staff || staff.isDeleted) {
            return res.status(404).json({ success: false, message: 'Staff user not found.' });
        }

        // Check permission to delete
        if (creatorRole === 'franchise-admin' && staff.role !== 'store-manager') {
            return res.status(403).json({ success: false, message: 'You can only delete store managers.' });
        }
        if (creatorRole === 'store-manager' && staff.role !== 'kitchen-staff' && staff.role !== 'kitchen-supervisor') {
            return res.status(403).json({ success: false, message: 'You can only delete kitchen staff or supervisors.' });
        }

        staff.isDeleted = true;
        await staff.save();
        return res.status(200).json({ success: true, message: 'Staff deleted successfully' });
    } catch (err) {
        next(err);
    }
};
