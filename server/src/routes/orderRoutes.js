import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/').post(createOrder).get(adminOnly, getAllOrders);
router.get('/mine', getMyOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);
router.patch('/:id/status', adminOnly, updateOrderStatus);

export default router;
