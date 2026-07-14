import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export async function uploadImage(
  buffer: Buffer,
  folder: string = 'attendance'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `phew-hrms/${folder}`,
        resource_type: 'image',
        transformation: [{ width: 1024, height: 1024, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message || 'Cloudinary upload failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
