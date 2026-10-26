import express from 'express';
import { uploadFileBuffer, uploadImageBuffer, uploadVideoBuffer } from '../../../services/cloudinary.service.js';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../core/roles/role.middleware.js';
import { safeUpload } from '../../../middleware/safeUpload.js';

const router = express.Router();

// Every signed-in role that uploads today: admin panels, customers (support/complaint files)
// and delivery partners (pickup proof). Anonymous requests are rejected.
router.use(
    authMiddleware,
    requireRoles('ADMIN', 'STORE-MANAGER', 'KITCHEN-SUPERVISOR', 'KITCHEN-STAFF', 'USER', 'DELIVERY_PARTNER')
);

const normalizeRole = (role) => String(role || '').trim().replace(/_/g, '-').toUpperCase();
const STORE_ROLES = new Set(['STORE-MANAGER', 'KITCHEN-SUPERVISOR', 'KITCHEN-STAFF']);
const SUFFIX = { image: '', pdf: '/files', video: '/videos' };

// Folders the admin panels and the rider app ask for today. Only these are honoured, and only for the
// role that uses them; the first entry is the default. Everything else goes to a folder for the caller's
// own role and scope, so nobody can write into another area (e.g. store-approval documents).
const SUPER_ADMIN_FOLDERS = {
    image: ['uploads', 'welcome/images', 'search/new-launches', 'search/tabs', 'combo-page', 'bulk-orders'],
    pdf: ['uploads', 'bulk-orders'],
    video: ['uploads/videos', 'welcome/videos']
};
const DELIVERY_FOLDERS = { image: ['appzeto/delivery/bills'], pdf: [], video: [] };

export function chooseUploadFolder(user, kind, requested) {
    const role = normalizeRole(user?.role);
    const asked = typeof requested === 'string' ? requested.trim() : '';
    const own = (base) => `${base}${SUFFIX[kind]}`;
    if (role === 'SUPERADMIN' || role === 'SUPER-ADMIN') {
        return SUPER_ADMIN_FOLDERS[kind].includes(asked) ? asked : SUPER_ADMIN_FOLDERS[kind][0];
    }
    if (role === 'DELIVERY-PARTNER') return DELIVERY_FOLDERS[kind].includes(asked) ? asked : own('delivery/uploads');
    if (role === 'FRANCHISE-ADMIN') return own(`franchises/${user?.franchiseId || 'unscoped'}/uploads`);
    if (STORE_ROLES.has(role)) return own(`stores/${user?.storeId || 'unscoped'}/uploads`);
    return own('customers/uploads');
}

// POST /v1/uploads/image
router.post('/image', safeUpload('image'), async (req, res, next) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const folder = chooseUploadFolder(req.user, 'image', req.body?.folder);

        const url = await uploadImageBuffer(req.file.buffer, folder);

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url,
                publicId: null
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /v1/uploads/file
router.post('/file', safeUpload('pdf'), async (req, res, next) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const mimeType = String(req.file.mimetype || '').toLowerCase();
        const originalName = String(req.file.originalname || '').toLowerCase();
        const isPdf = mimeType === 'application/pdf' || originalName.endsWith('.pdf');
        if (!isPdf) {
            return res.status(400).json({
                success: false,
                message: 'Only PDF files are allowed'
            });
        }

        const folder = chooseUploadFolder(req.user, 'pdf', req.body?.folder);

        const url = await uploadFileBuffer(req.file.buffer, folder, {
            fileName: req.file.originalname || 'menu.pdf',
            format: 'pdf'
        });

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url,
                publicId: null
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /v1/uploads/video
router.post('/video', safeUpload('video'), async (req, res, next) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const mimeType = String(req.file.mimetype || '').toLowerCase();
        if (!mimeType.startsWith('video/')) {
            return res.status(400).json({
                success: false,
                message: 'Only video files are allowed'
            });
        }

        const folder = chooseUploadFolder(req.user, 'video', req.body?.folder);

        const url = await uploadVideoBuffer(req.file.buffer, folder);

        return res.status(200).json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                url,
                publicId: null
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;

