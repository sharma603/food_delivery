import express from 'express';
import cache from '../middleware/cache.js';

const router = express.Router();

import { protect, authorize } from '../middleware/auth.js';

import { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser,
  getAllAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/userController.js';

router.route('/').get(protect, authorize('admin'), cache(), getUsers);

router.route('/:id').get(protect, cache(), getUser).put(protect, updateUser).delete(protect, authorize('admin'), deleteUser);

// Address routes
router.route('/addresses/all').get(protect, getAllAddresses);
router.route('/addresses/:addressId')
  .get(protect, getAddress)
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);
router.route('/addresses').post(protect, addAddress);

export default router;