import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/restaurant-documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(0 * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const restaurantUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for restaurant documents
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(jpeg|jpg|png)|application\/pdf/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed for restaurant documents'));
    }
  }
});

// Define the fields for restaurant registration
export const restaurantRegistrationUpload = restaurantUpload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'foodSafetyLicense', maxCount: 1 },
  { name: 'ownerIdProof', maxCount: 1 }
]);

export default restaurantUpload;