import { userClient } from "@/services/api/axios"
import { initRazorpayPayment } from "@food/utils/razorpay"

/**
 * Pay a bulk order online with Razorpay: the server makes the Razorpay order (for the estimated total), the checkout opens,
 * and the answer is verified on the server. Resolves { paid: true } when the payment was verified, { paid: false } when the
 * customer closed the window, and rejects with a message when something went wrong.
 */
export async function payBulkOrder(order) {
  const res = await userClient.post(`/food/user/bulk-orders/${order.id}/pay`, {})
  const razorpay = res?.data?.data?.razorpay
  if (!razorpay?.orderId) throw new Error("Payment could not be started")
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (fn, value) => { if (!settled) { settled = true; fn(value) } }
    initRazorpayPayment({
      key: razorpay.key,
      amount: razorpay.amount,
      currency: razorpay.currency,
      order_id: razorpay.orderId,
      description: `Bulk order ${order.reference}`,
      prefill: { name: order.name, email: order.email, contact: order.phone },
      notes: { bulkOrder: String(order.reference) },
      handler: async (r) => {
        try {
          await userClient.post(`/food/user/bulk-orders/${order.id}/verify-payment`, {
            razorpayOrderId: r.razorpay_order_id,
            razorpayPaymentId: r.razorpay_payment_id,
            razorpaySignature: r.razorpay_signature,
          })
          finish(resolve, { paid: true })
        } catch (err) {
          finish(reject, new Error(err?.response?.data?.message || err?.response?.data?.error || "Payment received but not confirmed yet. Please contact support if it does not update."))
        }
      },
      onClose: () => finish(resolve, { paid: false }),
      onError: (e) => finish(reject, new Error(e?.description || "Payment failed. You can try again.")),
    }).catch(() => finish(reject, new Error("Could not open the payment window. Please try again.")))
  })
}
