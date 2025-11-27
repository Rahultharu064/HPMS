import express from 'express';
import {
    createServiceOrder,
    getAllServiceOrders,
    getServiceOrderById,
    updateServiceOrder,
    addItemsToServiceOrder
} from '../controllers/serviceOrderController.js';

const router = express.Router();

router.post('/', createServiceOrder);
router.get('/', getAllServiceOrders);
router.get('/:id', getServiceOrderById);
router.put('/:id', updateServiceOrder);
router.post('/:id/items', addItemsToServiceOrder);

export default router;
