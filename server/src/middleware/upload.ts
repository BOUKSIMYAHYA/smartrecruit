import multer from 'multer';
import { Request } from 'express';
import { ENV } from '../config/env.js';

// Memory storage to inspect magic bytes before committing to disk
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Format de fichier rejeté : seuls les fichiers PDF sont acceptés.'));
  }

  // Check file extension
  if (!file.originalname.toLowerCase().endsWith('.pdf')) {
    return cb(new Error('Extension de fichier rejetée : l\'extension doit obligatoirement être .pdf'));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024, // 10 MB limit
    files: 1,
  },
  fileFilter,
});

export const uploadBatch = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 10,
  },
  fileFilter,
});

const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.mimetype.toLowerCase())) {
    return cb(new Error('Format d\'image non valide : seuls JPEG, PNG et WEBP sont acceptés.'));
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max for avatar pictures
    files: 1,
  },
  fileFilter: imageFilter,
});
