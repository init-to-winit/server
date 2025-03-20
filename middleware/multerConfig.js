import multer from 'multer';

const storage = multer.memoryStorage(); // Store file in memory as a buffer

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'video/mp4',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, PDF, and MP4 are allowed.')
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB
});

export default upload;
