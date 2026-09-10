import { useState, useEffect } from 'react';

// MOCK PAYMENTS COLLECTION
export const mockPayments = {
  'PAY-001': { _id: 'PAY-001', paymentAmount: 549.00, gatewayName: 'Razorpay', transactionId: 'pay_RZP_984321', availableBalance: 549.00 },
  'PAY-002': { _id: 'PAY-002', paymentAmount: 1290.00, gatewayName: 'Stripe', transactionId: 'ch_STR_771092', availableBalance: 1290.00 },
  'PAY-003': { _id: 'PAY-003', paymentAmount: 380.00, gatewayName: 'Paytm', transactionId: 'txn_PTM_551204', availableBalance: 380.00 },
  'PAY-004': { _id: 'PAY-004', paymentAmount: 840.00, gatewayName: 'Cashfree', transactionId: 'cf_TXN_098715', availableBalance: 840.00 },
  'PAY-005': { _id: 'PAY-005', paymentAmount: 220.00, gatewayName: 'PhonePe', transactionId: 'pp_TXN_228941', availableBalance: 220.00 },
  'PAY-006': { _id: 'PAY-006', paymentAmount: 650.00, gatewayName: 'Razorpay', transactionId: 'pay_RZP_112233', availableBalance: 0.00 }, // Completed
  'PAY-007': { _id: 'PAY-007', paymentAmount: 110.00, gatewayName: 'Paytm', transactionId: 'txn_PTM_448899', availableBalance: 110.00 }, // Rejected
  'PAY-008': { _id: 'PAY-008', paymentAmount: 950.00, gatewayName: 'Stripe', transactionId: 'ch_STR_445566', availableBalance: 950.00 }
};

// MOCK CUSTOMERS COLLECTION
export const mockCustomers = {
  'CUST-001': {
    _id: 'CUST-001',
    name: 'Rajesh Kumar',
    phone: '+91 98765-43210',
    email: 'rajesh.kumar@gmail.com',
    address: 'Apt 402, Sea Breeze Heights, Bandra West, Mumbai, MH - 400050',
    lifetimeOrders: 42,
    lifetimeSpend: 18450.00,
    lastOrderDate: '2026-06-17'
  },
  'CUST-002': {
    _id: 'CUST-002',
    name: 'Priya Patel',
    phone: '+91 99887-76655',
    email: 'priya.patel@yahoo.com',
    address: 'House No 12, GIDC Colony, Satellite, Ahmedabad, GJ - 380015',
    lifetimeOrders: 18,
    lifetimeSpend: 6290.00,
    lastOrderDate: '2026-06-18'
  },
  'CUST-003': {
    _id: 'CUST-003',
    name: 'Aarav Mehta',
    phone: '+91 91234-56789',
    email: 'aarav.mehta@outlook.com',
    address: 'Block C-3, Prestige Residency, Indiranagar, Bengaluru, KA - 560038',
    lifetimeOrders: 31,
    lifetimeSpend: 12400.00,
    lastOrderDate: '2026-06-15'
  },
  'CUST-004': {
    _id: 'CUST-004',
    name: 'Sunita Gupta',
    phone: '+91 88776-65544',
    email: 'sunita.gupta@rediffmail.com',
    address: 'Flat 101, Rosewood Apartments, Sector 15, Noida, UP - 201301',
    lifetimeOrders: 5,
    lifetimeSpend: 2490.00,
    lastOrderDate: '2026-06-14'
  },
  'CUST-005': {
    _id: 'CUST-005',
    name: 'Vikram Singh',
    phone: '+91 77665-54433',
    email: 'vikram.singh@gmail.com',
    address: 'Plot 78, Vaishali Nagar, Jaipur, RJ - 302021',
    lifetimeOrders: 27,
    lifetimeSpend: 9550.00,
    lastOrderDate: '2026-06-16'
  },
  'CUST-006': {
    _id: 'CUST-006',
    name: 'Anjali Sharma',
    phone: '+91 99988-87776',
    email: 'anjali.sharma@gmail.com',
    address: 'H-403, Park View Society, Gachibowli, Hyderabad, TS - 500032',
    lifetimeOrders: 15,
    lifetimeSpend: 4780.00,
    lastOrderDate: '2026-06-12'
  },
  'CUST-007': {
    _id: 'CUST-007',
    name: 'Rohan Deshmukh',
    phone: '+91 88877-76665',
    email: 'rohan.deshmukh@gmail.com',
    address: 'Flat 5B, Orchid Towers, Kothrud, Pune, MH - 411038',
    lifetimeOrders: 21,
    lifetimeSpend: 8350.00,
    lastOrderDate: '2026-06-11'
  },
  'CUST-008': {
    _id: 'CUST-008',
    name: 'Kabir Sengupta',
    phone: '+91 90077-11223',
    email: 'kabir.sen@gmail.com',
    address: '14/2, Ballygunge Circular Road, Kolkata, WB - 700019',
    lifetimeOrders: 35,
    lifetimeSpend: 15200.00,
    lastOrderDate: '2026-06-18'
  }
};

// MOCK ORDERS & ITEMS snapshots
export const mockOrders = {
  'ORD-98421': {
    _id: 'ORD-98421',
    orderNumber: 'PV-98421',
    grandTotal: 549.00,
    taxAmount: 26.14,
    discount: 50.00,
    deliveryFee: 40.00,
    paymentMethod: 'Prepaid (Online)',
    paymentStatus: 'Paid',
    orderStatus: 'Cancelled',
    deliveryStatus: 'Not Dispatched',
    couponApplied: 'WELCOME50',
    items: [
      { product: 'Double Cheese Margherita', variant: 'Medium', qty: 1, price: 349.00, subtotal: 349.00 },
      { product: 'Garlic Bread Stix', variant: 'Classic', qty: 2, price: 105.00, subtotal: 210.00 }
    ]
  },
  'ORD-98422': {
    _id: 'ORD-98422',
    orderNumber: 'PV-98422',
    grandTotal: 1290.00,
    taxAmount: 61.43,
    discount: 100.00,
    deliveryFee: 0.00,
    paymentMethod: 'Prepaid (Card)',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    deliveryStatus: 'Delivered',
    couponApplied: 'PIZZAPARTY',
    items: [
      { product: 'Papa Veg Premium Feast', variant: 'Large', qty: 2, price: 595.00, subtotal: 1190.00 },
      { product: 'Choco Lava Cake', variant: 'Single', qty: 2, price: 100.00, subtotal: 200.00 }
    ]
  },
  'ORD-98423': {
    _id: 'ORD-98423',
    orderNumber: 'PV-98423',
    grandTotal: 380.00,
    taxAmount: 18.10,
    discount: 0.00,
    deliveryFee: 40.00,
    paymentMethod: 'Prepaid (Wallet)',
    paymentStatus: 'Paid',
    orderStatus: 'Cancelled',
    deliveryStatus: 'Not Dispatched',
    couponApplied: 'None',
    items: [
      { product: 'Farm Villa Pizza', variant: 'Medium', qty: 1, price: 340.00, subtotal: 340.00 }
    ]
  },
  'ORD-98424': {
    _id: 'ORD-98424',
    orderNumber: 'PV-98424',
    grandTotal: 840.00,
    taxAmount: 40.00,
    discount: 80.00,
    deliveryFee: 30.00,
    paymentMethod: 'Prepaid (Netbanking)',
    paymentStatus: 'Paid',
    orderStatus: 'Cancelled',
    deliveryStatus: 'Not Dispatched',
    couponApplied: 'MIDWEEK30',
    items: [
      { product: 'Peppy Paneer Pizza', variant: 'Large', qty: 1, price: 590.00, subtotal: 590.00 },
      { product: 'Capsicum Pizza Mania', variant: 'Regular', qty: 3, price: 100.00, subtotal: 300.00 }
    ]
  },
  'ORD-98425': {
    _id: 'ORD-98425',
    orderNumber: 'PV-98425',
    grandTotal: 220.00,
    taxAmount: 10.48,
    discount: 0.00,
    deliveryFee: 30.00,
    paymentMethod: 'Prepaid (UPI)',
    paymentStatus: 'Paid',
    orderStatus: 'Cancelled',
    deliveryStatus: 'Not Dispatched',
    couponApplied: 'None',
    items: [
      { product: 'Stuffed Garlic Bread', variant: 'Classic', qty: 1, price: 190.00, subtotal: 190.00 }
    ]
  },
  'ORD-98426': {
    _id: 'ORD-98426',
    orderNumber: 'PV-98426',
    grandTotal: 650.00,
    taxAmount: 30.95,
    discount: 50.00,
    deliveryFee: 40.00,
    paymentMethod: 'Prepaid (UPI)',
    paymentStatus: 'Paid',
    orderStatus: 'Cancelled',
    deliveryStatus: 'Not Dispatched',
    couponApplied: 'WELCOME50',
    items: [
      { product: 'Veggie Paradise Pizza', variant: 'Medium', qty: 2, price: 330.00, subtotal: 660.00 }
    ]
  },
  'ORD-98427': {
    _id: 'ORD-98427',
    orderNumber: 'PV-98427',
    grandTotal: 110.00,
    taxAmount: 5.24,
    discount: 0.00,
    deliveryFee: 30.00,
    paymentMethod: 'Prepaid (Wallet)',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    deliveryStatus: 'Delivered',
    couponApplied: 'None',
    items: [
      { product: 'Onion Pizza Mania', variant: 'Regular', qty: 1, price: 80.00, subtotal: 80.00 }
    ]
  },
  'ORD-98428': {
    _id: 'ORD-98428',
    orderNumber: 'PV-98428',
    grandTotal: 950.00,
    taxAmount: 45.24,
    discount: 100.00,
    deliveryFee: 0.00,
    paymentMethod: 'Prepaid (Card)',
    paymentStatus: 'Paid',
    orderStatus: 'Cancelled',
    deliveryStatus: 'Not Dispatched',
    couponApplied: 'FESTIVE100',
    items: [
      { product: 'Cheese N Corn Pizza', variant: 'Large', qty: 2, price: 525.00, subtotal: 1050.00 }
    ]
  }
};

// INITIAL REFUND REQUESTS AND CORRESPONDING HISTORY
let mockRefundRequests = [
  {
    _id: 'RF-99231',
    refundNumber: 'RF-99231',
    orderId: 'ORD-98421',
    customerId: 'CUST-001',
    paymentId: 'PAY-001',
    refundAmount: 549.00,
    reason: 'Store was closed, order could not be prepared',
    status: 'requested',
    approvedBy: '',
    adminNotes: '',
    gatewayResponse: null,
    createdAt: '2026-06-18T16:30:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-18T16:30:00Z', updatedBy: 'System Trigger', role: 'System Automated', remarks: 'Refund requested due to Order Cancellation.' }
    ]
  },
  {
    _id: 'RF-99230',
    refundNumber: 'RF-99230',
    orderId: 'ORD-98422',
    customerId: 'CUST-002',
    paymentId: 'PAY-002',
    refundAmount: 500.00,
    reason: 'Complained: Delivered pizza had burnt toppings, customer demanded partial compensation',
    status: 'under_review',
    approvedBy: 'Amit Patel',
    adminNotes: 'Customer support approved partial refund after verifying uploaded photo proof.',
    gatewayResponse: null,
    createdAt: '2026-06-18T15:15:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-18T15:15:00Z', updatedBy: 'Customer Support Bot', role: 'System', remarks: 'Requested partial compensation.' },
      { status: 'under_review', timestamp: '2026-06-18T15:45:00Z', updatedBy: 'Amit Patel', role: 'Support Executive', remarks: 'Assigned for photo verification.' }
    ]
  },
  {
    _id: 'RF-99229',
    refundNumber: 'RF-99229',
    orderId: 'ORD-98423',
    customerId: 'CUST-003',
    paymentId: 'PAY-003',
    refundAmount: 380.00,
    reason: 'Delayed delivery over 90 minutes. Order refused by client',
    status: 'approved',
    approvedBy: 'Vikram Phadke',
    adminNotes: 'SLA breach confirmed by rider GPS tracking. Full refund authorized.',
    gatewayResponse: null,
    createdAt: '2026-06-18T13:10:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-18T13:10:00Z', updatedBy: 'System Trigger', role: 'System Automated', remarks: 'Order cancelled due to SLA Breach.' },
      { status: 'under_review', timestamp: '2026-06-18T13:20:00Z', updatedBy: 'Vikram Phadke', role: 'Franchise Auditor', remarks: 'Checking delivery timestamps.' },
      { status: 'approved', timestamp: '2026-06-18T13:45:00Z', updatedBy: 'Vikram Phadke', role: 'Franchise Auditor', remarks: 'Refund approved. Queued for gateway disbursement.' }
    ]
  },
  {
    _id: 'RF-99228',
    refundNumber: 'RF-99228',
    orderId: 'ORD-98424',
    customerId: 'CUST-004',
    paymentId: 'PAY-004',
    refundAmount: 840.00,
    reason: 'Rider met with an accident. Order damaged',
    status: 'requested',
    approvedBy: '',
    adminNotes: '',
    gatewayResponse: null,
    createdAt: '2026-06-18T10:05:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-18T10:05:00Z', updatedBy: 'Store Manager', role: 'Store Operator', remarks: 'Rider reported accident, order damaged.' }
    ]
  },
  {
    _id: 'RF-99227',
    refundNumber: 'RF-99227',
    orderId: 'ORD-98425',
    customerId: 'CUST-005',
    paymentId: 'PAY-005',
    refundAmount: 220.00,
    reason: 'Wrong items delivered (Veg Combo instead of Garlic bread stix)',
    status: 'processing',
    approvedBy: 'Shubham Jamliya',
    adminNotes: 'Verified with kitchen CCTV packing records. Corrected error and refund triggered.',
    gatewayResponse: { status: 'initiated', api_msg: 'Gateway handshake completed, pending confirmation from bank' },
    createdAt: '2026-06-18T09:20:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-18T09:20:00Z', updatedBy: 'System Trigger', role: 'System Automated', remarks: 'Incorrect package complaint filed.' },
      { status: 'under_review', timestamp: '2026-06-18T09:40:00Z', updatedBy: 'Shubham Jamliya', role: 'Super Admin', remarks: 'Checking CCTV package capture.' },
      { status: 'approved', timestamp: '2026-06-18T09:55:00Z', updatedBy: 'Shubham Jamliya', role: 'Super Admin', remarks: 'Refund amount verified.' },
      { status: 'processing', timestamp: '2026-06-18T10:00:00Z', updatedBy: 'Shubham Jamliya', role: 'Super Admin', remarks: 'Sent refund payload to PhonePe API.' }
    ]
  },
  {
    _id: 'RF-99226',
    refundNumber: 'RF-99226',
    orderId: 'ORD-98426',
    customerId: 'CUST-006',
    paymentId: 'PAY-006',
    refundAmount: 650.00,
    reason: 'Out of stock ingredients for Pizza Paradise feast',
    status: 'completed',
    approvedBy: 'Shubham Jamliya',
    adminNotes: 'Transaction processed successfully through Razorpay API.',
    gatewayResponse: { status: 'success', paymentId: 'pay_RZP_112233', refundId: 'rfnd_RZP_776655', processedAt: '2026-06-17T18:05:00Z' },
    createdAt: '2026-06-17T17:40:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-17T17:40:00Z', updatedBy: 'Store Manager', role: 'Store Operator', remarks: 'Customer agreed to cancel due to stock issues.' },
      { status: 'under_review', timestamp: '2026-06-17T17:50:00Z', updatedBy: 'Shubham Jamliya', role: 'Super Admin', remarks: 'Approval validated.' },
      { status: 'approved', timestamp: '2026-06-17T17:55:00Z', updatedBy: 'Shubham Jamliya', role: 'Super Admin', remarks: 'Verified amount match.' },
      { status: 'processing', timestamp: '2026-06-17T18:00:00Z', updatedBy: 'Shubham Jamliya', role: 'Super Admin', remarks: 'Dispatched Razorpay refund request.' },
      { status: 'completed', timestamp: '2026-06-17T18:05:00Z', updatedBy: 'System Webhook', role: 'Payment Gateway', remarks: 'Disbursed to customer UPI account.' }
    ]
  },
  {
    _id: 'RF-99225',
    refundNumber: 'RF-99225',
    orderId: 'ORD-98427',
    customerId: 'CUST-007',
    paymentId: 'PAY-007',
    refundAmount: 110.00,
    reason: 'Claimed delivery delay but GPS shows order was delivered within 25 minutes',
    status: 'rejected',
    approvedBy: 'Amit Patel',
    adminNotes: 'Rejected. Rider logs and customer OTP confirmation shows order was delivered successfully on time.',
    gatewayResponse: null,
    createdAt: '2026-06-17T12:00:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-17T12:00:00Z', updatedBy: 'Customer Support Bot', role: 'System', remarks: 'Claimed non-delivery of items.' },
      { status: 'under_review', timestamp: '2026-06-17T12:15:00Z', updatedBy: 'Amit Patel', role: 'Support Executive', remarks: 'Checking rider GPS audit log.' },
      { status: 'rejected', timestamp: '2026-06-17T12:30:00Z', updatedBy: 'Amit Patel', role: 'Support Executive', remarks: 'Rejection reason: Claim false. OTP delivery match confirmed.' }
    ]
  },
  {
    _id: 'RF-99224',
    refundNumber: 'RF-99224',
    orderId: 'ORD-98428',
    customerId: 'CUST-008',
    paymentId: 'PAY-008',
    refundAmount: 950.00,
    reason: 'Customer cancelled order prior to kitchen validation',
    status: 'completed',
    approvedBy: 'System Trigger',
    adminNotes: 'Automated Stripe instant refund since kitchen had not accepted the order.',
    gatewayResponse: { status: 'success', paymentId: 'ch_STR_445566', refundId: 're_STR_998800', processedAt: '2026-06-16T14:45:00Z' },
    createdAt: '2026-06-16T14:40:00Z',
    history: [
      { status: 'requested', timestamp: '2026-06-16T14:40:00Z', updatedBy: 'System Trigger', role: 'System Automated', remarks: 'Pre-kitchen cancellation refund requested.' },
      { status: 'approved', timestamp: '2026-06-16T14:41:00Z', updatedBy: 'System Trigger', role: 'System Automated', remarks: 'System auto-approved cancellation.' },
      { status: 'processing', timestamp: '2026-06-16T14:42:00Z', updatedBy: 'System Trigger', role: 'System Automated', remarks: 'API payload dispatched.' },
      { status: 'completed', timestamp: '2026-06-16T14:45:00Z', updatedBy: 'System Webhook', role: 'Payment Gateway', remarks: 'Stripe refund settled.' }
    ]
  }
];

// MOCK REFUND ACTIVITY LOGS (AUDIT REPORT SOURCE)
export const mockActivityLogs = [
  { action: 'APPROVE_REFUND', user: 'Shubham Jamliya', role: 'Super Admin', timestamp: '2026-06-18T10:00:00Z', ipAddress: '192.168.1.10', remarks: 'Approved PhonePe partial refund RF-99227' },
  { action: 'REJECT_REFUND', user: 'Amit Patel', role: 'Support Executive', timestamp: '2026-06-17T12:30:00Z', ipAddress: '192.168.1.42', remarks: 'Rejected non-delivery claim RF-99225' },
  { action: 'APPROVE_REFUND', user: 'Shubham Jamliya', role: 'Super Admin', timestamp: '2026-06-17T17:55:00Z', ipAddress: '192.168.1.10', remarks: 'Approved Razorpay refund RF-99226' },
  { action: 'AUDIT_DOWNLOAD', user: 'Shubham Jamliya', role: 'Super Admin', timestamp: '2026-06-17T10:00:00Z', ipAddress: '192.168.1.10', remarks: 'Generated Monthly CSV Report' },
  { action: 'REVIEW_START', user: 'Amit Patel', role: 'Support Executive', timestamp: '2026-06-18T15:45:00Z', ipAddress: '192.168.1.42', remarks: 'Started review for partial complaint RF-99230' }
];

// API SIMULATIONS
export const getRefundRequests = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockRefundRequests]);
    }, 400);
  });
};

export const getRefundDetails = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const refund = mockRefundRequests.find(r => r._id === id);
      if (!refund) {
        reject(new Error('Refund not found'));
        return;
      }
      const order = mockOrders[refund.orderId] || null;
      const customer = mockCustomers[refund.customerId] || null;
      const payment = mockPayments[refund.paymentId] || null;
      resolve({
        ...refund,
        order,
        customer,
        payment
      });
    }, 300);
  });
};

export const approveRefund = (id, amount, notes, user = 'Shubham Jamliya', role = 'Super Admin') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const refund = mockRefundRequests.find(r => r._id === id);
      if (refund) {
        refund.status = 'processing';
        refund.refundAmount = amount;
        refund.approvedBy = user;
        refund.adminNotes = notes;
        refund.gatewayResponse = {
          status: 'initiated',
          amount: amount,
          initiatedAt: new Date().toISOString(),
          msg: 'Gateway processing handoff'
        };
        // Add to history
        refund.history.push({
          status: 'approved',
          timestamp: new Date().toISOString(),
          updatedBy: user,
          role: role,
          remarks: `Approved refund of ₹${amount.toFixed(2)}. Notes: ${notes}`
        });
        refund.history.push({
          status: 'processing',
          timestamp: new Date().toISOString(),
          updatedBy: 'System API',
          role: 'Payment Gateway',
          remarks: 'Gateway handshake dispatched.'
        });

        // Add to audit activity
        mockActivityLogs.unshift({
          action: 'APPROVE_REFUND',
          user: user,
          role: role,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.12',
          remarks: `Approved refund ${id} for amount ₹${amount.toFixed(2)}`
        });
      }
      resolve({ success: true, refund: { ...refund } });
    }, 500);
  });
};

export const rejectRefund = (id, reason, remarks, user = 'Amit Patel', role = 'Support Executive') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const refund = mockRefundRequests.find(r => r._id === id);
      if (refund) {
        refund.status = 'rejected';
        refund.adminNotes = `Rejected: ${reason}. ${remarks}`;
        // Add to history
        refund.history.push({
          status: 'rejected',
          timestamp: new Date().toISOString(),
          updatedBy: user,
          role: role,
          remarks: `Rejected. Reason: ${reason}. Remarks: ${remarks}`
        });

        // Add to audit activity
        mockActivityLogs.unshift({
          action: 'REJECT_REFUND',
          user: user,
          role: role,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.12',
          remarks: `Rejected refund ${id}. Reason: ${reason}`
        });
      }
      resolve({ success: true, refund: { ...refund } });
    }, 500);
  });
};

// DEBOUNCE HOOK
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
