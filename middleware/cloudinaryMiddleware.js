import cloudinary from '../config/cloudinary.js';

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(fileBuffer);
  });
};

export const uploadProfilePhoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const result = await uploadToCloudinary(
      req.file.buffer,
      'VISMOH/profile_photos',
      'image'
    );
    req.uploadedFileUrl = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
};

export const uploadCertificate = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const result = await uploadToCloudinary(
      req.file.buffer,
      'VISMOH/certificates',
      'auto'
    );
    req.uploadedFileUrl = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
};

export const uploadVideo = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const result = await uploadToCloudinary(
      req.file.buffer,
      'VISMOH/videos',
      'video'
    );
    req.uploadedFileUrl = result.secure_url;
    next(); // ✅ Pass to next handler (AI analysis)
  } catch (error) {
    next(error);
  }
};
