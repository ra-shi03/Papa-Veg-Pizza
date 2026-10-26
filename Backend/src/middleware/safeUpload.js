import multer from 'multer';

// Size-limited, MIME-allowlisted uploads whose content is checked against the real file signature.
// Use this instead of the bare `upload` middleware for anything a non-admin (or anonymous caller) can reach.

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

export const UPLOAD_RULES = {
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

/**
 * @param {'image'|'pdf'|'video'} kind
 * @param {string | {name:string,maxCount:number}[]} fields  one field name (single file) or multer fields
 */
export const safeUpload = (kind, fields = 'file') => {
    const rule = UPLOAD_RULES[kind];
    const fileCount = typeof fields === 'string' ? 1 : fields.reduce((n, f) => n + (f.maxCount || 1), 0);
    const instance = multer({
        storage: multer.memoryStorage(),
        // Text fields are capped too, so a request cannot fill memory with form data either.
        limits: { fileSize: rule.maxBytes, files: fileCount, fields: 50, fieldSize: 100 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (rule.mimes.includes(String(file.mimetype || '').toLowerCase())) return cb(null, true);
            const err = new Error(`Only ${rule.label} are allowed`);
            err.statusCode = 400;
            return cb(err);
        }
    });
    const parser = typeof fields === 'string' ? instance.single(fields) : instance.fields(fields);

    return (req, res, next) => {
        parser(req, res, (err) => {
            if (err) {
                const tooLarge = err.code === 'LIMIT_FILE_SIZE';
                const message = tooLarge
                    ? `File is too large (max ${rule.maxBytes / MB} MB)`
                    : err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT'
                        ? 'Unexpected or too many files'
                        : err.message;
                return res.status(tooLarge ? 413 : err.statusCode || 400).json({ success: false, message });
            }
            const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
            if (files.some((f) => !signatures[kind](f.buffer))) {
                return res.status(400).json({
                    success: false,
                    message: `File content does not match the declared type. Only ${rule.label} are allowed`
                });
            }
            return next();
        });
    };
};
