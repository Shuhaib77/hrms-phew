import multer from 'multer';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';

const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}`, 400, 'INVALID_FILE_TYPE'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.uploadLimits.fileSize },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadArray = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

export { upload };
