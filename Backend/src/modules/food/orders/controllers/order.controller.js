import { sendResponse } from '../../../../utils/response.js';
import * as orderService from '../services/order.service.js';
import * as foodOrderPaymentService from '../services/foodOrderPayment.service.js';
import { HomePage } from '../../settings/models/homePage.model.js';
import {
    validateCalculateOrderDto,
    validateCreateOrderDto,
    validateVerifyPaymentDto,
    validateCancelOrderDto,
    validateOrderStatusDto,
    validateAssignDeliveryDto,
    validateDispatchSettingsDto,
    validateOrderRatingsDto
} from '../validators/order.validator.js';

export async function calculateOrderController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const dto = validateCalculateOrderDto(req.body);
        const result = await orderService.calculateOrder(userId, dto);
        return sendResponse(res, 200, 'Pricing calculated', result);
    } catch (err) {
        next(err);
    }
}

export async function createOrderController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const dto = validateCreateOrderDto(req.body);
        const result = await orderService.createOrder(userId, dto);
        return sendResponse(res, 201, 'Order placed successfully', result);
    } catch (err) {
        next(err);
    }
}

export async function verifyPaymentController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const dto = validateVerifyPaymentDto(req.body);
        const result = await orderService.verifyPayment(userId, dto);
        return sendResponse(res, 200, 'Payment verified', result);
    } catch (err) {
        next(err);
    }
}

export async function listOrdersUserController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const result = await orderService.listOrdersUser(userId, req.query);
        return sendResponse(res, 200, 'Orders retrieved', result);
    } catch (err) {
        next(err);
    }
}

export async function getOrderByIdUserController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.getOrderById(orderId, { userId });
        return sendResponse(res, 200, 'Order retrieved', { order });
    } catch (err) {
        next(err);
    }
}

export async function getOrderDropOtpUserController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;
        const result = await orderService.getDropOtpUser(orderId, userId);
        return sendResponse(res, 200, 'Drop OTP retrieved', result);
    } catch (err) {
        next(err);
    }
}

/** Ledger rows from `food_order_payments` (append-only audit trail) */
export async function getOrderPaymentsUserController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;
        const result = await foodOrderPaymentService.listFoodOrderPaymentsForUser(orderId, userId);
        return sendResponse(res, 200, 'Payment history', result);
    } catch (err) {
        next(err);
    }
}

export async function cancelOrderController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;
        const dto = validateCancelOrderDto(req.body);
        const order = await orderService.cancelOrder(orderId, userId, dto.reason, dto.refundDestination);
        return sendResponse(res, 200, 'Order cancelled', { order });
    } catch (err) {
        next(err);
    }
}

export async function submitOrderRatingsController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;
        const dto = validateOrderRatingsDto(req.body);
        const order = await orderService.submitOrderRatings(orderId, userId, dto);
        return sendResponse(res, 200, 'Ratings submitted successfully', { order });
    } catch (err) {
        next(err);
    }
}

export async function updateOrderInstructionsController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;
        const instructions = req.body.instructions;
        const order = await orderService.updateOrderInstructions(orderId, userId, instructions);
        return sendResponse(res, 200, 'Instructions updated successfully', { order });
    } catch (err) {
        next(err);
    }
}

export async function getDispatchSettingsController(req, res, next) {
    try {
        const result = await orderService.getDispatchSettings();
        return sendResponse(res, 200, 'Dispatch settings retrieved', result);
    } catch (err) {
        next(err);
    }
}

export async function updateDispatchSettingsController(req, res, next) {
    try {
        const adminId = req.user?.userId;
        const dto = validateDispatchSettingsDto(req.body);
        const result = await orderService.updateDispatchSettings(dto.dispatchMode, adminId);
        return sendResponse(res, 200, 'Dispatch settings updated', result);
    } catch (err) {
        next(err);
    }
}

export async function listOrdersStoreController(req, res, next) {
    try {
        const storeId = req.user?.userId;
        const result = await orderService.listOrdersStore(storeId, req.query);
        return sendResponse(res, 200, 'Orders retrieved', result);
    } catch (err) {
        next(err);
    }
}

export async function getOrderByIdStoreController(req, res, next) {
    try {
        const storeId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.getOrderById(orderId, { storeId });
        return sendResponse(res, 200, 'Order retrieved', { order });
    } catch (err) {
        next(err);
    }
}

export async function updateOrderStatusStoreController(req, res, next) {
    try {
        const storeId = req.user?.userId;
        const orderId = req.params.orderId;
        const dto = validateOrderStatusDto(req.body);
        const order = await orderService.updateOrderStatusStore(orderId, storeId, dto.orderStatus, dto.note);
        return sendResponse(res, 200, 'Order status updated', { order });
    } catch (err) {
        next(err);
    }
}

export async function listOrdersAvailableDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const result = await orderService.listOrdersAvailableDelivery(deliveryPartnerId, req.query);
        return sendResponse(res, 200, 'Orders retrieved', result);
    } catch (err) {
        next(err);
    }
}

export async function acceptOrderDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.acceptOrderDelivery(orderId, deliveryPartnerId);
        return sendResponse(res, 200, 'Order accepted', { order });
    } catch (err) {
        next(err);
    }
}

export async function rejectOrderDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.rejectOrderDelivery(orderId, deliveryPartnerId);
        return sendResponse(res, 200, 'Order rejected', { order });
    } catch (err) {
        next(err);
    }
}

export async function confirmReachedPickupDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.confirmReachedPickupDelivery(orderId, deliveryPartnerId);
        return sendResponse(res, 200, 'Reached pickup confirmed', { order });
    } catch (err) {
        next(err);
    }
}

export async function confirmPickupDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const { billImageUrl } = req.body;
        const order = await orderService.confirmPickupDelivery(orderId, deliveryPartnerId, billImageUrl);
        return sendResponse(res, 200, 'Pickup confirmed', { order });
    } catch (err) {
        next(err);
    }
}

export async function confirmReachedDropDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.confirmReachedDropDelivery(orderId, deliveryPartnerId);
        return sendResponse(res, 200, 'Reached drop confirmed', { order });
    } catch (err) {
        next(err);
    }
}

export async function verifyDropOtpDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const { otp } = req.body;
        const result = await orderService.verifyDropOtpDelivery(orderId, deliveryPartnerId, otp);
        return sendResponse(res, 200, 'OTP verified', { order: result.order });
    } catch (err) {
        next(err);
    }
}

export async function completeDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.completeDelivery(orderId, deliveryPartnerId, req.body || {});
        return sendResponse(res, 200, 'Delivery completed', { order });
    } catch (err) {
        next(err);
    }
}

export async function updateOrderStatusDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const dto = validateOrderStatusDto(req.body);
        const order = await orderService.updateOrderStatusDelivery(orderId, deliveryPartnerId, dto.orderStatus);
        return sendResponse(res, 200, 'Order status updated', { order });
    } catch (err) {
        next(err);
    }
}

export async function getCurrentTripDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const order = await orderService.getCurrentTripDelivery(deliveryPartnerId);
        return sendResponse(res, 200, 'Current trip retrieved', { activeOrder: order });
    } catch (err) {
        next(err);
    }
}

export async function createCollectQrController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const customerInfo = req.body || {};
        const result = await orderService.createCollectQr(orderId, deliveryPartnerId, customerInfo);
        return sendResponse(res, 200, 'QR created', result);
    } catch (err) {
        next(err);
    }
}

export async function getOrderByIdDeliveryController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const order = await orderService.getOrderById(orderId, { deliveryPartnerId });
        return sendResponse(res, 200, 'Order retrieved', { order });
    } catch (err) {
        next(err);
    }
}

export async function getPaymentStatusController(req, res, next) {
    try {
        const deliveryPartnerId = req.user?.userId;
        const orderId = req.params.orderId;
        const result = await orderService.getPaymentStatus(orderId, deliveryPartnerId);
        return sendResponse(res, 200, 'Payment status retrieved', result);
    } catch (err) {
        next(err);
    }
}

export async function listOrdersAdminController(req, res, next) {
    try {
        const result = await orderService.listOrdersAdmin(req.query);
        return sendResponse(res, 200, 'Orders retrieved', result);
    } catch (err) {
        next(err);
    }
}

export async function getOrderByIdAdminController(req, res, next) {
    try {
        const orderId = req.params.orderId;
        const order = await orderService.getOrderById(orderId, { admin: true });
        return sendResponse(res, 200, 'Order retrieved', { order });
    } catch (err) {
        next(err);
    }
}

export async function assignDeliveryPartnerController(req, res, next) {
    try {
        const adminId = req.user?.userId;
        const orderId = req.params.orderId;
        const dto = validateAssignDeliveryDto(req.body);
        const order = await orderService.assignDeliveryPartnerAdmin(orderId, dto.deliveryPartnerId, adminId);
        return sendResponse(res, 200, 'Delivery partner assigned', { order });
    } catch (err) {
        next(err);
    }
}

export async function deleteOrderAdminController(req, res, next) {
    try {
        const adminId = req.user?.userId;
        const orderId = req.params.orderId;
        const result = await orderService.deleteOrderAdmin(orderId, adminId);
        return sendResponse(res, 200, 'Order deleted successfully', result);
    } catch (err) {
        next(err);
    }
}

export async function resendDeliveryNotificationStoreController(req, res, next) {
    try {
        const storeId = req.user?.userId;
        const orderId = req.params.orderId;
        const result = await orderService.resendDeliveryNotificationStore(orderId, storeId);
        return sendResponse(res, 200, 'Notification resent successfully', result);
    } catch (err) {
        next(err);
    }
}

export async function trackOrderPublicController(req, res, next) {
    try {
        const phone = req.body?.phone || req.body?.mobileNumber || req.query?.phone || req.query?.mobileNumber;
        const orderId = req.body?.orderId || req.body?.order_id || req.query?.orderId || req.query?.order_id;

        if (!phone || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Both Mobile Number and Order ID are required.'
            });
        }

        const result = await orderService.trackOrderPublic(phone, orderId);
        return sendResponse(res, 200, 'Order tracking details retrieved successfully', result);
    } catch (err) {
        if (err.statusCode || err.status) {
            return res.status(err.statusCode || err.status).json({
                success: false,
                message: err.message
            });
        }
        return res.status(err.name === 'NotFoundError' ? 404 : 400).json({
            success: false,
            message: err.message || 'Unable to track order. Please check your details.'
        });
    }
}

export async function getOrderHistoryPublicController(req, res, next) {
    try {
        const phone = req.body?.phone || req.body?.mobileNumber || req.query?.phone || req.query?.mobileNumber;
        const orderId = req.body?.orderId || req.body?.order_id || req.query?.orderId || req.query?.order_id;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required.'
            });
        }

        const result = await orderService.getOrderHistoryPublic(phone, orderId);
        return sendResponse(res, 200, 'Order history retrieved successfully', result);
    } catch (err) {
        if (err.statusCode || err.status) {
            return res.status(err.statusCode || err.status).json({
                success: false,
                message: err.message
            });
        }
        return res.status(err.name === 'NotFoundError' ? 404 : 400).json({
            success: false,
            message: err.message || 'Unable to retrieve order history. Please check your details.'
        });
    }
}

export async function getOrderMethodsController(req, res, next) {
    try {
        let config = await HomePage.findOne().lean();
        let methods = config?.orderMethods;
        if (!methods || !Array.isArray(methods) || methods.length === 0) {
            methods = [
                { id: 'delivery', label: 'Delivery', icon: 'moped', enabled: true },
                { id: 'dine_in', label: 'Dine-In', icon: 'restaurant', enabled: true },
                { id: 'takeaway', label: 'Takeaway', icon: 'store', enabled: true },
                { id: 'train', label: 'Delivery on Train', icon: 'train', enabled: true },
                { id: 'incar', label: 'In-Car', icon: 'directions_car', enabled: true }
            ];
        }
        return sendResponse(res, 200, 'Order methods retrieved successfully', {
            methods: methods.map(m => ({
                id: m.id === 'dinein' ? 'dine_in' : m.id,
                label: m.label,
                icon: m.icon || '',
                enabled: m.enabled !== false
            }))
        });
    } catch (err) {
        next(err);
    }
}
