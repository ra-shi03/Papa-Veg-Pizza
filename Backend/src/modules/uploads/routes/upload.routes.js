import express from 'express';
import multer from 'multer';
import { uploadFileBuffer, uploadImageBuffer, uploadVideoBuffer } from '../../../services/cloudinary.service.js';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../core/roles/role.middleware.js';

const router = express.Router();

// Every signed-in role that uploads today: admin panels, customers (support/complaint files)
// and delivery partners (pickup proof). Anonymous requests are rejected.
router.use(
    authMiddleware,
    requireRoles('ADMIN', 'STORE-MANAGER', 'KITCHEN-SUPERVISOR', 'KITCHEN-STAFF', 'USER', 'DELIVERY_PARTNER')
);

const MB = 1024 * 1024;

const bytesAt = (buf, offset, bytes) => bytes.every((b, i) => buf[offset + i] === b);
// "ftyp" box at offset 4 is shared by MP4/MOV/HEIC/HEIF containers.
const isFtyp = (buf) => bytesAt(buf, 4, [0x66, 0x74, 0x79, 0x70]);

// The declared mimetype is client-controlled, so the real file signature is checked as well.
const signatures = {
    image: (b) =>
        bytesAt(b, 0, [0xff, 0xd8, 0xff]) ||
        bytesAt(b, 0, [0x89, 0x50, 0x4e, 0x47]) ||
        bytesAt(b, 0, [0x47, 0x49, 0x46, 0x38]) ||
        (bytesAt(b, 0, [0x52, 0x49, 0x46, 0x46]) && bytesAt(b, 8, [0x57, 0x45, 0x42, 0x50])) ||
        isFtyp(b),
    pdf: (b) => bytesAt(b, 0, [0x25, 0x50, 0x44, 0x46]),
    video: (b) => isFtyp(b) || bytesAt(b, 0, [0x1a, 0x45, 0xdf, 0xa3])
};

const UPLOAD_RULES = {
    image: {
        maxBytes: 5 * MB,
        mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
        label: 'JPEG, PNG, WebP, GIF or HEIC images'
    },
    pdf: { maxBytes: 10 * MB, mimes: ['application/pdf'], label: 'PDF files' },
    video: {
        maxBytes: 50 * MB,
        mimes: ['video/mp4', 'video/webm', 'video/quicktime'],
        label: 'MP4, WebM or MOV videos'
    }
};

// Dedicated multer per upload kind, so the limits here don't change the shared upload middleware.
const singleFile = (kind) => {
    const rule = UPLOAD_RULES[kind];
    const parser = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: rule.maxBytes, files: 1 },
        fileFilter: (_req, file, cb) => {
            if (rule.mimes.includes(String(file.mimetype || '').toLowerCase())) return cb(null, true);
            const err = new Error(`Only ${rule.label} are allowed`);
            err.statusCode = 400;
            return cb(err);
        }
    }).single('file');

    return (req, res, next) => {
        parser(req, res, (err) => {
            if (err) {
                const tooLarge = err.code === 'LIMIT_FILE_SIZE';
                return res.status(tooLarge ? 413 : err.statusCode || 400).json({
                    success: false,
                    message: tooLarge ? `File is too large (max ${rule.maxBytes / MB} MB)` : err.message
                });
            }
            if (req.file && !signatures[kind](req.file.buffer)) {
                return res.status(400).json({
                    success: false,
                    message: `File content does not match the declared type. Only ${rule.label} are allowed`
                });
            }
            return next();
        });
    };
};

// POST /v1/uploads/image
router.post('/image', singleFile('image'), async (req, res, next) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
            ? req.body.folder.trim()
            : 'uploads';

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
router.post('/file', singleFile('pdf'), async (req, res, next) => {
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

        const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
            ? req.body.folder.trim()
            : 'uploads';

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
router.post('/video', singleFile('video'), async (req, res, next) => {
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

        const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
            ? req.body.folder.trim()
            : 'uploads/videos';

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

