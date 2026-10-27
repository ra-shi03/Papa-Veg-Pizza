import multer from 'multer';

const storage = multer.memoryStorage();

// Bare upload for authenticated admin / franchise / customer forms. It has hard limits so that no signed-in user can
// fill the server's memory with one request; use safeUpload() where the file type must also be checked.
export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 20, fields: 100, fieldSize: 1024 * 1024 },
});

