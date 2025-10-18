import express from 'express';
import { register, login, getMe, updateProfile, refreshToken, logoutAll } from '../controllers/authController.js';
import { 
  getAllAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);
router.post('/logout-all', protect, logoutAll);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Address management routes
router.get('/addresses', protect, getAllAddresses);
router.post('/addresses', protect, addAddress);
router.get('/addresses/:addressId', protect, getAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

export default router;