// AllOrdersData.jsx
// Mock Database and simulated REST APIs for Papa Veg Pizza Super Admin Panel
import { useState, useEffect } from 'react';

// --- COLLECTION: FRANCHISES ---
export const mockFranchises = [
  { _id: 'fran-001', name: 'West India Foods', city: 'Mumbai' },
  { _id: 'fran-002', name: 'North Region Ops', city: 'Delhi' },
  { _id: 'fran-003', name: 'South Crust Pvt Ltd', city: 'Bangalore' },
  { _id: 'fran-004', name: 'Central Pizza Partners', city: 'Indore' }
];

// --- COLLECTION: STORES ---
export const mockStores = [
  { _id: 'store-101', franchiseId: 'fran-001', name: 'Mumbai - Bandra West', manager: 'Amit Malhotra', phone: '+91 98201 12345', address: 'Linking Road, Bandra West, Mumbai 400050', timings: '11:00 AM - 11:59 PM', prepEta: '20 mins' },
  { _id: 'store-102', franchiseId: 'fran-001', name: 'Mumbai - Andheri East', manager: 'Sandip Patil', phone: '+91 98202 23456', address: 'J B Nagar, Andheri East, Mumbai 400059', timings: '11:00 AM - 01:00 AM', prepEta: '25 mins' },
  { _id: 'store-201', franchiseId: 'fran-002', name: 'Delhi - Connaught Place', manager: 'Rajesh Sharma', phone: '+91 98110 34567', address: 'F-Block, Connaught Place, New Delhi 110001', timings: '10:00 AM - 11:00 PM', prepEta: '15 mins' },
  { _id: 'store-202', franchiseId: 'fran-002', name: 'Delhi - GK 2', manager: 'Vikram Gupta', phone: '+91 98112 45678', address: 'M-Block Market, Greater Kailash II, New Delhi 110048', timings: '11:00 AM - 12:00 AM', prepEta: '22 mins' },
  { _id: 'store-301', franchiseId: 'fran-003', name: 'Bangalore - Indiranagar', manager: 'Siddharth Nair', phone: '+91 98450 56789', address: '100 Feet Road, Indiranagar, Bangalore 560038', timings: '11:00 AM - 01:00 AM', prepEta: '18 mins' },
  { _id: 'store-401', franchiseId: 'fran-004', name: 'Indore - Vijay Nagar', manager: 'Manish Verma', phone: '+91 98930 67890', address: 'C21 Mall Road, Vijay Nagar, Indore 452010', timings: '11:00 AM - 11:00 PM', prepEta: '20 mins' }
];

// --- COLLECTION: CUSTOMERS ---
export const mockCustomers = [
  { _id: 'cust-001', name: 'Rohan Deshmukh', phone: '+91 98200 98765', email: 'rohan.desh@gmail.com', address: 'Apt 402, Sea Breeze, Carter Road, Bandra West, Mumbai 400050', lat: 19.0664, lng: 72.8223 },
  { _id: 'cust-002', name: 'Ananya Iyer', phone: '+91 98451 87654', email: 'ananya.iyer@yahoo.com', address: 'Flat 12B, Ferns Paradise, Outer Ring Road, Indiranagar, Bangalore 560038', lat: 12.9784, lng: 77.6408 },
  { _id: 'cust-003', name: 'Gaurav Khurana', phone: '+91 98100 76543', email: 'gaurav.k@outlook.com', address: 'H-56, Rajouri Garden, New Delhi 110027', lat: 28.6415, lng: 77.1209 },
  { _id: 'cust-004', name: 'Kavita Joshi', phone: '+91 98932 65432', email: 'kavita.joshi@rediffmail.com', address: 'Sector C, Scheme 54, Vijay Nagar, Indore 452010', lat: 22.7533, lng: 75.8937 },
  { _id: 'cust-005', name: 'Aditya Sen', phone: '+91 98300 54321', email: 'aditya.sen@gmail.com', address: 'P-45, Lake Road, Bandra West, Mumbai 400050', lat: 19.0601, lng: 72.8250 },
  { _id: 'cust-006', name: 'Meera Patel', phone: '+91 98250 43210', email: 'meera.patel@gmail.com', address: 'Block D, GK 2, New Delhi 110048', lat: 28.5305, lng: 77.2431 }
];

// --- COLLECTION: DELIVERY PARTNERS (Riders) ---
export const mockDeliveryPartners = [
  { _id: 'rider-001', name: 'Rahul Dev', phone: '+91 98101 22334', vehicleNumber: 'MH-02-EE-4509', currentLat: 19.0680, currentLng: 72.8250 },
  { _id: 'rider-002', name: 'Karan Singh', phone: '+91 98450 33445', vehicleNumber: 'KA-03-JX-9920', currentLat: 12.9790, currentLng: 77.6420 },
  { _id: 'rider-003', name: 'Vikram Rathore', phone: '+91 98930 44556', vehicleNumber: 'MP-09-CQ-2894', currentLat: 22.7540, currentLng: 75.8950 },
  { _id: 'rider-004', name: 'Amit Kumar', phone: '+91 98110 55667', vehicleNumber: 'DL-03-SE-8840', currentLat: 28.6420, currentLng: 77.1230 }
];

// --- COLLECTION: PRODUCTS ---
export const mockProducts = [
  { _id: 'prod-001', name: 'Double Cheese Margherita', variant: 'Medium', price: 345 },
  { _id: 'prod-002', name: 'Tandoori Paneer Delight', variant: 'Large', price: 595 },
  { _id: 'prod-003', name: 'Farmhouse Special', variant: 'Medium', price: 425 },
  { _id: 'prod-004', name: 'Veggie Supreme Feast', variant: 'Large', price: 625 },
  { _id: 'prod-005', name: 'Stuffed Garlic Breadsticks', variant: 'Standard', price: 149 },
  { _id: 'prod-006', name: 'Choco Lava Overflow Cake', variant: 'Standard', price: 109 }
];

// --- DATABASE STATE: ORDERS & RELATED ITEMS (Simulated MongoDB collections in Memory) ---
let dbOrders = [
  {
    _id: 'ord-1001',
    orderNumber: 'PV-9042',
    customerId: 'cust-001',
    franchiseId: 'fran-001',
    storeId: 'store-101',
    deliveryPartnerId: 'rider-001',
    paymentId: 'pay-1001',
    subtotal: 940,
    taxAmount: 47,
    discountAmount: 100,
    deliveryFee: 40,
    grandTotal: 927,
    orderType: 'Delivery',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    orderStatus: 'Out For Delivery',
    couponCode: 'PIZZALOVE',
    specialInstructions: 'Please make it extra spicy and ring bell twice.',
    createdAt: '2026-06-18T14:20:00Z',
    eta: '17:20 PM'
  },
  {
    _id: 'ord-1002',
    orderNumber: 'PV-9041',
    customerId: 'cust-002',
    franchiseId: 'fran-003',
    storeId: 'store-301',
    deliveryPartnerId: 'rider-002',
    paymentId: 'pay-1002',
    subtotal: 595,
    taxAmount: 30,
    discountAmount: 0,
    deliveryFee: 40,
    grandTotal: 665,
    orderType: 'Delivery',
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    orderStatus: 'Preparing',
    couponCode: '',
    specialInstructions: 'No onions please.',
    createdAt: '2026-06-18T16:15:00Z',
    eta: '16:55 PM'
  },
  {
    _id: 'ord-1003',
    orderNumber: 'PV-9040',
    customerId: 'cust-003',
    franchiseId: 'fran-002',
    storeId: 'store-201',
    deliveryPartnerId: '',
    paymentId: 'pay-1003',
    subtotal: 494,
    taxAmount: 25,
    discountAmount: 50,
    deliveryFee: 0,
    grandTotal: 469,
    orderType: 'Pickup',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    orderStatus: 'Confirmed',
    couponCode: 'WELCOME50',
    specialInstructions: 'Keep it packed in thermal bag.',
    createdAt: '2026-06-18T16:30:00Z',
    eta: '16:50 PM'
  },
  {
    _id: 'ord-1004',
    orderNumber: 'PV-9039',
    customerId: 'cust-004',
    franchiseId: 'fran-004',
    storeId: 'store-401',
    deliveryPartnerId: 'rider-003',
    paymentId: 'pay-1004',
    subtotal: 1050,
    taxAmount: 53,
    discountAmount: 150,
    deliveryFee: 50,
    grandTotal: 1003,
    orderType: 'Delivery',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    orderStatus: 'Placed',
    couponCode: 'BIGPARTY',
    specialInstructions: 'Deliver near C21 Mall back gate.',
    createdAt: '2026-06-18T16:45:00Z',
    eta: '17:25 PM'
  },
  {
    _id: 'ord-1005',
    orderNumber: 'PV-9038',
    customerId: 'cust-005',
    franchiseId: 'fran-001',
    storeId: 'store-102',
    deliveryPartnerId: '',
    paymentId: 'pay-1005',
    subtotal: 345,
    taxAmount: 17,
    discountAmount: 0,
    deliveryFee: 40,
    grandTotal: 402,
    orderType: 'Delivery',
    paymentMethod: 'Wallet',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    couponCode: '',
    specialInstructions: '',
    createdAt: '2026-06-18T11:10:00Z',
    eta: '11:40 AM'
  },
  {
    _id: 'ord-1006',
    orderNumber: 'PV-9037',
    customerId: 'cust-006',
    franchiseId: 'fran-002',
    storeId: 'store-202',
    deliveryPartnerId: '',
    paymentId: 'pay-1006',
    subtotal: 774,
    taxAmount: 39,
    discountAmount: 100,
    deliveryFee: 40,
    grandTotal: 753,
    orderType: 'Delivery',
    paymentMethod: 'Card',
    paymentStatus: 'Refunded',
    orderStatus: 'Cancelled',
    couponCode: 'OFF100',
    specialInstructions: '',
    createdAt: '2026-06-18T09:30:00Z',
    eta: '10:05 AM'
  },
  {
    _id: 'ord-1007',
    orderNumber: 'PV-9036',
    customerId: 'cust-001',
    franchiseId: 'fran-001',
    storeId: 'store-101',
    deliveryPartnerId: 'rider-001',
    paymentId: 'pay-1007',
    subtotal: 494,
    taxAmount: 25,
    discountAmount: 0,
    deliveryFee: 40,
    grandTotal: 559,
    orderType: 'Delivery',
    paymentMethod: 'UPI',
    paymentStatus: 'Failed',
    orderStatus: 'Cancelled',
    couponCode: '',
    specialInstructions: '',
    createdAt: '2026-06-17T19:40:00Z',
    eta: '20:15 PM'
  },
  {
    _id: 'ord-1008',
    orderNumber: 'PV-9035',
    customerId: 'cust-003',
    franchiseId: 'fran-002',
    storeId: 'store-201',
    deliveryPartnerId: 'rider-004',
    paymentId: 'pay-1008',
    subtotal: 1220,
    taxAmount: 61,
    discountAmount: 200,
    deliveryFee: 30,
    grandTotal: 1111,
    orderType: 'Delivery',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    couponCode: 'SUNDAYFEAST',
    specialInstructions: 'Call before arriving.',
    createdAt: '2026-06-17T13:10:00Z',
    eta: '13:45 PM'
  }
];

// --- DATABASE STATE: ORDER ITEMS ---
let dbOrderItems = [
  // ord-1001 items
  { _id: 'item-1001a', orderId: 'ord-1001', productId: 'prod-002', quantity: 1, unitPrice: 595, taxAmount: 30, subtotal: 595 },
  { _id: 'item-1001b', orderId: 'ord-1001', productId: 'prod-001', quantity: 1, unitPrice: 345, taxAmount: 17, subtotal: 345 },
  // ord-1002 items
  { _id: 'item-1002a', orderId: 'ord-1002', productId: 'prod-002', quantity: 1, unitPrice: 595, taxAmount: 30, subtotal: 595 },
  // ord-1003 items
  { _id: 'item-1003a', orderId: 'ord-1003', productId: 'prod-001', quantity: 1, unitPrice: 345, taxAmount: 17, subtotal: 345 },
  { _id: 'item-1003b', orderId: 'ord-1003', productId: 'prod-005', quantity: 1, unitPrice: 149, taxAmount: 8, subtotal: 149 },
  // ord-1004 items
  { _id: 'item-1004a', orderId: 'ord-1004', productId: 'prod-004', quantity: 1, unitPrice: 625, taxAmount: 31, subtotal: 625 },
  { _id: 'item-1004b', orderId: 'ord-1004', productId: 'prod-003', quantity: 1, unitPrice: 425, taxAmount: 22, subtotal: 425 },
  // ord-1005 items
  { _id: 'item-1005a', orderId: 'ord-1005', productId: 'prod-001', quantity: 1, unitPrice: 345, taxAmount: 17, subtotal: 345 },
  // ord-1006 items
  { _id: 'item-1006a', orderId: 'ord-1006', productId: 'prod-004', quantity: 1, unitPrice: 625, taxAmount: 31, subtotal: 625 },
  { _id: 'item-1006b', orderId: 'ord-1006', productId: 'prod-005', quantity: 1, unitPrice: 149, taxAmount: 8, subtotal: 149 },
  // ord-1007 items
  { _id: 'item-1007a', orderId: 'ord-1007', productId: 'prod-001', quantity: 1, unitPrice: 345, taxAmount: 17, subtotal: 345 },
  { _id: 'item-1007b', orderId: 'ord-1007', productId: 'prod-005', quantity: 1, unitPrice: 149, taxAmount: 8, subtotal: 149 },
  // ord-1008 items
  { _id: 'item-1008a', orderId: 'ord-1008', productId: 'prod-002', quantity: 2, unitPrice: 595, taxAmount: 30, subtotal: 1190 },
  { _id: 'item-1008b', orderId: 'ord-1008', productId: 'prod-006', quantity: 1, unitPrice: 109, taxAmount: 5, subtotal: 109 }
];

// --- DATABASE STATE: ORDER STATUS LOGS ---
let dbOrderStatusLogs = [
  { _id: 'log-1', orderId: 'ord-1001', status: 'Placed', updatedBy: 'Rohan Deshmukh', role: 'Customer', remarks: 'Order submitted via Android App', createdAt: '2026-06-18T14:20:00Z' },
  { _id: 'log-2', orderId: 'ord-1001', status: 'Confirmed', updatedBy: 'Amit Malhotra', role: 'Store Manager', remarks: 'Store accepted order', createdAt: '2026-06-18T14:22:00Z' },
  { _id: 'log-3', orderId: 'ord-1001', status: 'Preparing', updatedBy: 'Chef Harpal', role: 'Kitchen Staff', remarks: 'Baking in Oven Station 1', createdAt: '2026-06-18T14:25:00Z' },
  { _id: 'log-4', orderId: 'ord-1001', status: 'Packed', updatedBy: 'Amit Malhotra', role: 'Store Manager', remarks: 'Packed in insulated thermal bag', createdAt: '2026-06-18T14:40:00Z' },
  { _id: 'log-5', orderId: 'ord-1001', status: 'Assigned', updatedBy: 'Auto-Allocation Engine', role: 'System', remarks: 'Rider Rahul Dev accepted delivery run', createdAt: '2026-06-18T14:42:00Z' },
  { _id: 'log-6', orderId: 'ord-1001', status: 'Out For Delivery', updatedBy: 'Rahul Dev', role: 'Rider', remarks: 'Picked up pizza box and heading to customer location', createdAt: '2026-06-18T14:46:00Z' },

  { _id: 'log-7', orderId: 'ord-1002', status: 'Placed', updatedBy: 'Ananya Iyer', role: 'Customer', remarks: 'Order submitted via Web App', createdAt: '2026-06-18T16:15:00Z' },
  { _id: 'log-8', orderId: 'ord-1002', status: 'Confirmed', updatedBy: 'Siddharth Nair', role: 'Store Manager', remarks: 'Store confirmed order', createdAt: '2026-06-18T16:17:00Z' },
  { _id: 'log-9', orderId: 'ord-1002', status: 'Preparing', updatedBy: 'Chef Kumar', role: 'Kitchen Staff', remarks: 'Topping prep initiated', createdAt: '2026-06-18T16:20:00Z' },

  { _id: 'log-10', orderId: 'ord-1003', status: 'Placed', updatedBy: 'Gaurav Khurana', role: 'Customer', remarks: 'Order submitted', createdAt: '2026-06-18T16:30:00Z' },
  { _id: 'log-11', orderId: 'ord-1003', status: 'Confirmed', updatedBy: 'Rajesh Sharma', role: 'Store Manager', remarks: 'Confirmed for takeaway', createdAt: '2026-06-18T16:33:00Z' },

  { _id: 'log-12', orderId: 'ord-1004', status: 'Placed', updatedBy: 'Kavita Joshi', role: 'Customer', remarks: 'Order submitted with Cash On Delivery', createdAt: '2026-06-18T16:45:00Z' },

  { _id: 'log-13', orderId: 'ord-1005', status: 'Placed', updatedBy: 'Aditya Sen', role: 'Customer', remarks: 'Submitted order', createdAt: '2026-06-18T11:10:00Z' },
  { _id: 'log-14', orderId: 'ord-1005', status: 'Confirmed', updatedBy: 'Sandip Patil', role: 'Store Manager', remarks: 'Confirmed', createdAt: '2026-06-18T11:12:00Z' },
  { _id: 'log-15', orderId: 'ord-1005', status: 'Delivered', updatedBy: 'Rider Sanjay', role: 'Rider', remarks: 'Handed over to customer', createdAt: '2026-06-18T11:40:00Z' },

  { _id: 'log-16', orderId: 'ord-1006', status: 'Placed', updatedBy: 'Meera Patel', role: 'Customer', remarks: 'Submitted order', createdAt: '2026-06-18T09:30:00Z' },
  { _id: 'log-17', orderId: 'ord-1006', status: 'Cancelled', updatedBy: 'System Engine', role: 'System', remarks: 'Cancelled due to payment gateway refund request', createdAt: '2026-06-18T09:35:00Z' }
];

// --- DATABASE STATE: PAYMENTS ---
let dbPayments = [
  { _id: 'pay-1001', orderId: 'ord-1001', txnId: 'TXN-UPI-99402910', gateway: 'Razorpay', amount: 927, tax: 47, discount: 100, method: 'UPI', status: 'Paid', time: '2026-06-18T14:20:30Z', refundStatus: 'None', refundAmount: 0 },
  { _id: 'pay-1002', orderId: 'ord-1002', txnId: 'TXN-CC-88301290', gateway: 'Razorpay', amount: 665, tax: 30, discount: 0, method: 'Card', status: 'Paid', time: '2026-06-18T16:15:40Z', refundStatus: 'None', refundAmount: 0 },
  { _id: 'pay-1003', orderId: 'ord-1003', txnId: 'TXN-UPI-77401289', gateway: 'Paytm', amount: 469, tax: 25, discount: 50, method: 'UPI', status: 'Paid', time: '2026-06-18T16:30:45Z', refundStatus: 'None', refundAmount: 0 },
  { _id: 'pay-1004', orderId: 'ord-1004', txnId: 'N/A', gateway: 'COD', amount: 1003, tax: 53, discount: 150, method: 'Cash', status: 'Pending', time: 'N/A', refundStatus: 'None', refundAmount: 0 },
  { _id: 'pay-1005', orderId: 'ord-1005', txnId: 'TXN-WL-66401928', gateway: 'Paytm Wallet', amount: 402, tax: 17, discount: 0, method: 'Wallet', status: 'Paid', time: '2026-06-18T11:10:45Z', refundStatus: 'None', refundAmount: 0 },
  { _id: 'pay-1006', orderId: 'ord-1006', txnId: 'TXN-CC-55201982', gateway: 'Razorpay', amount: 753, tax: 39, discount: 100, method: 'Card', status: 'Refunded', time: '2026-06-18T09:31:00Z', refundStatus: 'Full Refunded', refundAmount: 753 }
];

// --- DATABASE STATE: REFUNDS ---
let dbRefunds = [
  { _id: 'ref-1001', orderId: 'ord-1006', amount: 753, type: 'Full Refund', reason: 'Customer cancelled order before prep', gateway: 'Razorpay', status: 'Success', createdAt: '2026-06-18T09:40:00Z' }
];

// --- HELPERS FOR COMBINING DATA (Like MongoDB $lookup stages) ---
const joinOrderData = (order) => {
  if (!order) return null;
  const customer = mockCustomers.find(c => c._id === order.customerId) || {};
  const store = mockStores.find(s => s._id === order.storeId) || {};
  const franchise = mockFranchises.find(f => f._id === order.franchiseId) || {};
  const deliveryPartner = mockDeliveryPartners.find(dp => dp._id === order.deliveryPartnerId) || {};
  const items = dbOrderItems
    .filter(item => item.orderId === order._id)
    .map(item => {
      const prod = mockProducts.find(p => p._id === item.productId) || {};
      return {
        ...item,
        productName: prod.name,
        variant: prod.variant
      };
    });
  const payment = dbPayments.find(p => p.orderId === order._id) || {};

  return {
    ...order,
    customer,
    store,
    franchise,
    deliveryPartner,
    items,
    payment,
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };
};

// --- SIMULATED APIS (With latency promise wrappers) ---

export const getKpiData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const totalOrders = dbOrders.length;
      
      const todayDate = '2026-06-18';
      const todayOrders = dbOrders.filter(o => o.createdAt.startsWith(todayDate)).length;
      
      const completedOrders = dbOrders.filter(o => o.orderStatus === 'Delivered').length;
      
      const pendingOrders = dbOrders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length;
      
      const cancelledOrders = dbOrders.filter(o => o.orderStatus === 'Cancelled').length;
      
      const refundedOrders = dbOrders.filter(o => o.paymentStatus === 'Refunded').length;
      
      const sumRevenue = dbOrders
        .filter(o => o.paymentStatus === 'Paid')
        .reduce((sum, o) => sum + o.grandTotal, 0);

      const sumAllTotals = dbOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      const aov = totalOrders > 0 ? Math.round(sumAllTotals / totalOrders) : 0;

      resolve({
        totalOrders,
        todayOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        refundedOrders,
        aov,
        totalRevenue: sumRevenue
      });
    }, 400);
  });
};

export const getOrders = (filters = {}, page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...dbOrders];

      // 1. Search Query (orderNumber, customer name, customer phone)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(order => {
          const joined = joinOrderData(order);
          return (
            order.orderNumber.toLowerCase().includes(query) ||
            (joined.customer.name && joined.customer.name.toLowerCase().includes(query)) ||
            (joined.customer.phone && joined.customer.phone.toLowerCase().includes(query))
          );
        });
      }

      // 2. Franchise Filter
      if (filters.franchise && filters.franchise !== 'All') {
        filtered = filtered.filter(o => o.franchiseId === filters.franchise);
      }

      // 3. Store Filter
      if (filters.store && filters.store !== 'All') {
        filtered = filtered.filter(o => o.storeId === filters.store);
      }

      // 4. City Filter
      if (filters.city && filters.city !== 'All') {
        filtered = filtered.filter(o => {
          const franchise = mockFranchises.find(f => f._id === o.franchiseId);
          return franchise && franchise.city === filters.city;
        });
      }

      // 5. Order Type Filter
      if (filters.orderType && filters.orderType !== 'All') {
        filtered = filtered.filter(o => o.orderType === filters.orderType);
      }

      // 6. Payment Method Filter
      if (filters.paymentMethod && filters.paymentMethod !== 'All') {
        filtered = filtered.filter(o => o.paymentMethod === filters.paymentMethod);
      }

      // 7. Payment Status Filter
      if (filters.paymentStatus && filters.paymentStatus !== 'All') {
        filtered = filtered.filter(o => o.paymentStatus === filters.paymentStatus);
      }

      // 8. Order Status Filter
      if (filters.orderStatus && filters.orderStatus !== 'All') {
        filtered = filtered.filter(o => o.orderStatus === filters.orderStatus);
      }

      // 9. Date Range Filter
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        filtered = filtered.filter(o => new Date(o.createdAt) >= from);
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate);
        // Extend to end of day
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(o => new Date(o.createdAt) <= to);
      }

      // Sorting
      filtered.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'customerName') {
          valA = (mockCustomers.find(c => c._id === a.customerId)?.name || '').toLowerCase();
          valB = (mockCustomers.find(c => c._id === b.customerId)?.name || '').toLowerCase();
        } else if (sortBy === 'storeName') {
          valA = (mockStores.find(s => s._id === a.storeId)?.name || '').toLowerCase();
          valB = (mockStores.find(s => s._id === b.storeId)?.name || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Pagination
      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const paginatedOrders = filtered.slice(startIndex, startIndex + limit).map(joinOrderData);

      resolve({
        orders: paginatedOrders,
        total,
        page,
        pages: Math.ceil(total / limit)
      });
    }, 450);
  });
};

export const getOrderDetails = (orderId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const order = dbOrders.find(o => o._id === orderId || o.orderNumber === orderId);
      if (order) {
        resolve(joinOrderData(order));
      } else {
        reject(new Error('Order not found'));
      }
    }, 200);
  });
};

export const getOrderStatusLogs = (orderId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const actualOrderId = dbOrders.find(o => o._id === orderId || o.orderNumber === orderId)?._id || orderId;
      const logs = dbOrderStatusLogs.filter(log => log.orderId === actualOrderId);
      
      // Sort chronologically
      logs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      resolve(logs);
    }, 200);
  });
};

export const getOrderTracking = (orderId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const order = dbOrders.find(o => o._id === orderId || o.orderNumber === orderId);
      const joined = joinOrderData(order);
      
      resolve({
        orderId: joined?._id,
        orderNumber: joined?.orderNumber,
        status: joined?.orderStatus || 'Placed',
        rider: joined?.deliveryPartner || null,
        eta: joined?.eta || '25 mins',
        customerLat: joined?.customer?.lat || 19.0664,
        customerLng: joined?.customer?.lng || 72.8223,
        storeLat: 19.0650, // Mock fixed store lat
        storeLng: 72.8200, // Mock fixed store lng
        riderLat: joined?.deliveryPartner?.currentLat || 19.0680,
        riderLng: joined?.deliveryPartner?.currentLng || 72.8250,
        lastUpdated: new Date().toISOString()
      });
    }, 300);
  });
};

// PATCH /orders/:id/cancel
export const cancelOrderApi = (orderId, reason, refundRequired, refundAmount) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const orderIdx = dbOrders.findIndex(o => o._id === orderId || o.orderNumber === orderId);
      if (orderIdx !== -1) {
        const order = dbOrders[orderIdx];
        
        // Update status in local memory
        dbOrders[orderIdx] = {
          ...order,
          orderStatus: 'Cancelled',
          paymentStatus: refundRequired && order.paymentStatus === 'Paid' ? 'Refunded' : order.paymentStatus
        };

        // Insert timeline status log
        const logId = `log-${Date.now()}`;
        dbOrderStatusLogs.push({
          _id: logId,
          orderId: order._id,
          status: 'Cancelled',
          updatedBy: 'Super Admin',
          role: 'Super Admin',
          remarks: `Order Cancelled. Reason: ${reason}. Refund Triggered: ${refundRequired ? 'Yes (Amount: ₹' + refundAmount + ')' : 'No'}`,
          createdAt: new Date().toISOString()
        });

        // If refund is required, insert refund details
        if (refundRequired && order.paymentStatus === 'Paid') {
          const payIdx = dbPayments.findIndex(p => p.orderId === order._id);
          if (payIdx !== -1) {
            dbPayments[payIdx].status = 'Refunded';
            dbPayments[payIdx].refundStatus = 'Full Refunded';
            dbPayments[payIdx].refundAmount = parseFloat(refundAmount) || order.grandTotal;
          }

          dbRefunds.push({
            _id: `ref-${Date.now()}`,
            orderId: order._id,
            amount: parseFloat(refundAmount) || order.grandTotal,
            type: 'Full Refund',
            reason: `Order Cancelled: ${reason}`,
            gateway: dbPayments[payIdx]?.gateway || 'Razorpay',
            status: 'Success',
            createdAt: new Date().toISOString()
          });
        }

        resolve({ success: true, order: dbOrders[orderIdx] });
      } else {
        reject(new Error('Order not found'));
      }
    }, 500);
  });
};

// POST /refunds
export const initiateRefundApi = (orderId, type, amount, reason, gateway) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const orderIdx = dbOrders.findIndex(o => o._id === orderId || o.orderNumber === orderId);
      if (orderIdx !== -1) {
        const order = dbOrders[orderIdx];

        // Update paymentStatus in orders collection
        dbOrders[orderIdx] = {
          ...order,
          paymentStatus: 'Refunded'
        };

        // Update status in payments collection
        const payIdx = dbPayments.findIndex(p => p.orderId === order._id);
        if (payIdx !== -1) {
          dbPayments[payIdx].status = 'Refunded';
          dbPayments[payIdx].refundStatus = type === 'Full' ? 'Full Refunded' : 'Partially Refunded';
          dbPayments[payIdx].refundAmount = parseFloat(amount);
        }

        // Insert into refunds collection
        const refundId = `ref-${Date.now()}`;
        dbRefunds.push({
          _id: refundId,
          orderId: order._id,
          amount: parseFloat(amount),
          type: type === 'Full' ? 'Full Refund' : 'Partial Refund',
          reason: reason,
          gateway: gateway || 'Razorpay',
          status: 'Success',
          createdAt: new Date().toISOString()
        });

        // Insert timeline status log
        const logId = `log-${Date.now()}`;
        dbOrderStatusLogs.push({
          _id: logId,
          orderId: order._id,
          status: order.orderStatus,
          updatedBy: 'Super Admin',
          role: 'Super Admin',
          remarks: `Initiated ${type} Refund of ₹${amount}. Reason: ${reason}`,
          createdAt: new Date().toISOString()
        });

        resolve({ success: true, order: dbOrders[orderIdx] });
      } else {
        reject(new Error('Order not found'));
      }
    }, 500);
  });
};

// Debounce hook
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

// --- COLLECTION: GPS LOCATIONS (Simulated MongoDB Collection) ---
export let dbGpsLocations = [
  { _id: 'gps-1001', orderId: 'ord-1001', riderId: 'rider-001', latitude: 19.0680, longitude: 72.8250, speed: 32, heading: 120, timestamp: '2026-06-18T16:50:00Z' },
  { _id: 'gps-1002', orderId: 'ord-1002', riderId: 'rider-002', latitude: 12.9790, longitude: 77.6420, speed: 28, heading: 90, timestamp: '2026-06-18T16:51:00Z' },
  { _id: 'gps-1004', orderId: 'ord-1004', riderId: 'rider-003', latitude: 22.7540, longitude: 75.8950, speed: 0, heading: 0, timestamp: '2026-06-18T16:50:30Z' }
];

// --- EXTRA COLLECTION DATA FOR DETAILED MODALS ---
export const mockCustomerDetails = {
  'cust-001': { lifetimeOrders: 42, lifetimeSpend: 18450, recentOrders: ['PV-9042', 'PV-8920', 'PV-8812'], notes: 'Ring doorbell twice. Customer prefers contact-less drop.' },
  'cust-002': { lifetimeOrders: 18, lifetimeSpend: 8200, recentOrders: ['PV-9041', 'PV-8750'], notes: 'Call customer upon arrival. Tower B, Flat 12B.' },
  'cust-003': { lifetimeOrders: 29, lifetimeSpend: 13950, recentOrders: ['PV-9040', 'PV-8815'], notes: 'Deliver to security desk if unreachable.' },
  'cust-004': { lifetimeOrders: 8, lifetimeSpend: 3450, recentOrders: ['PV-9039'], notes: 'Cash on delivery. Keep change ready.' },
  'cust-005': { lifetimeOrders: 54, lifetimeSpend: 24100, recentOrders: ['PV-9038', 'PV-8904'], notes: 'Beware of stray dogs near gate.' },
  'cust-006': { lifetimeOrders: 3, lifetimeSpend: 1100, recentOrders: ['PV-9037'], notes: '' }
};

export const mockRiderDetails = {
  'rider-001': { avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', todayDeliveries: 14, rating: 4.9, speed: 32, activeStatus: 'Transit' },
  'rider-002': { avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', todayDeliveries: 9, rating: 4.7, speed: 28, activeStatus: 'Transit' },
  'rider-003': { avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', todayDeliveries: 11, rating: 4.5, speed: 0, activeStatus: 'Waiting at Store' },
  'rider-004': { avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', todayDeliveries: 16, rating: 4.8, speed: 35, activeStatus: 'Transit' }
};

// --- SIMULATED APIS FOR LIVE ORDER TRACKING PAGE ---

// GET /orders/live (returns only active preparation & delivery orders)
export const getLiveOrders = (filters = {}, page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Filter out Delivered and Cancelled orders
      let active = dbOrders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');

      // 1. Search Query
      if (filters.search) {
        const query = filters.search.toLowerCase();
        active = active.filter(order => {
          const customer = mockCustomers.find(c => c._id === order.customerId);
          return (
            order.orderNumber.toLowerCase().includes(query) ||
            (customer && customer.name.toLowerCase().includes(query)) ||
            (customer && customer.phone.toLowerCase().includes(query))
          );
        });
      }

      // 2. Franchise
      if (filters.franchise && filters.franchise !== 'All') {
        active = active.filter(o => o.franchiseId === filters.franchise);
      }

      // 3. Store
      if (filters.store && filters.store !== 'All') {
        active = active.filter(o => o.storeId === filters.store);
      }

      // 4. Rider
      if (filters.rider && filters.rider !== 'All') {
        active = active.filter(o => o.deliveryPartnerId === filters.rider);
      }

      // 5. Status
      if (filters.orderStatus && filters.orderStatus !== 'All') {
        active = active.filter(o => o.orderStatus === filters.orderStatus);
      }

      // 6. Delayed Only
      // Simulated: ord-1001 is set to Out For Delivery, let's treat it as delayed by 15 mins.
      // We will add custom delay flag mapping for testing delay lists.
      if (filters.delayedOnly) {
        active = active.filter(o => {
          // Mocking ord-1001 as delayed
          return o._id === 'ord-1001';
        });
      }

      // Join customer, store, and rider details
      let joined = active.map(order => {
        const customer = mockCustomers.find(c => c._id === order.customerId) || {};
        const store = mockStores.find(s => s._id === order.storeId) || {};
        const franchise = mockFranchises.find(f => f._id === order.franchiseId) || {};
        const deliveryPartner = mockDeliveryPartners.find(dp => dp._id === order.deliveryPartnerId) || {};
        const gps = dbGpsLocations.find(g => g.orderId === order._id) || {};
        
        // Calculate delay text
        let delayText = 'No Delay';
        let delayMinutes = 0;
        if (order._id === 'ord-1001') {
          delayText = '15 min delay';
          delayMinutes = 15;
        }

        return {
          ...order,
          customer,
          store,
          franchise,
          deliveryPartner: deliveryPartner.name ? deliveryPartner : null,
          gps,
          delayMinutes,
          delayText,
          expectedDeliveryTime: order._id === 'ord-1001' ? '14:55 PM' : order.eta
        };
      });

      // Sorting
      joined.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'customerName') {
          valA = (a.customer.name || '').toLowerCase();
          valB = (b.customer.name || '').toLowerCase();
        } else if (sortBy === 'storeName') {
          valA = (a.store.name || '').toLowerCase();
          valB = (b.store.name || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = joined.length;
      const startIndex = (page - 1) * limit;
      const paginated = joined.slice(startIndex, startIndex + limit);

      resolve({
        orders: paginated,
        total,
        page,
        pages: Math.ceil(total / limit)
      });
    }, 400);
  });
};

// GET /orders/:id/tracking (detailed stats for right panel map and cards)
export const getLiveOrderTracking = (orderId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const order = dbOrders.find(o => o._id === orderId || o.orderNumber === orderId);
      if (!order) return reject(new Error('Order not found'));

      const customer = mockCustomers.find(c => c._id === order.customerId) || {};
      const store = mockStores.find(s => s._id === order.storeId) || {};
      const franchise = mockFranchises.find(f => f._id === order.franchiseId) || {};
      const rider = mockDeliveryPartners.find(dp => dp._id === order.deliveryPartnerId) || {};
      const gps = dbGpsLocations.find(g => g.orderId === order._id) || {
        latitude: 19.0680, longitude: 72.8250, speed: 0, heading: 0
      };

      const riderDetails = mockRiderDetails[order.deliveryPartnerId] || {};
      const customerDetails = mockCustomerDetails[order.customerId] || {};

      resolve({
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        expectedDeliveryTime: order._id === 'ord-1001' ? '14:55 PM' : order.eta,
        delayMinutes: order._id === 'ord-1001' ? 15 : 0,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        orderType: order.orderType,

        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          lat: customer.lat,
          lng: customer.lng,
          ...customerDetails
        },

        store: {
          _id: store._id,
          name: store.name,
          address: store.address,
          manager: store.manager,
          phone: store.phone,
          lat: 19.0650, // Mock coordinates
          lng: 72.8200
        },

        franchise: {
          name: franchise.name
        },

        rider: rider.name ? {
          _id: rider._id,
          name: rider.name,
          phone: rider.phone,
          vehicleNumber: rider.vehicleNumber,
          lat: gps.latitude,
          lng: gps.longitude,
          speed: gps.speed || riderDetails.speed || 0,
          heading: gps.heading || 0,
          status: riderDetails.activeStatus || 'Idle',
          rating: riderDetails.rating || 4.5,
          todayDeliveries: riderDetails.todayDeliveries || 0,
          batteryLevel: 82,
          lastPing: new Date().toLocaleTimeString(),
          distanceRemaining: '1.2 km',
          eta: '8 mins'
        } : null
      });
    }, 350);
  });
};

// GET /delivery-partners/:id
export const getRiderDetailsApi = (riderId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const rider = mockDeliveryPartners.find(dp => dp._id === riderId);
      if (!rider) return reject(new Error('Rider not found'));
      const details = mockRiderDetails[riderId] || {};

      resolve({
        _id: rider._id,
        name: rider.name,
        phone: rider.phone,
        vehicleNumber: rider.vehicleNumber,
        status: details.activeStatus || 'Offline',
        todayDeliveries: details.todayDeliveries || 0,
        averageRating: details.rating || 4.5,
        avatar: details.avatar || '',
        speed: details.speed || 0,
        lat: rider.currentLat,
        lng: rider.currentLng,
        lastActiveTime: new Date().toLocaleTimeString()
      });
    }, 200);
  });
};

// GET /customers/:id
export const getCustomerDetailsApi = (customerId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const customer = mockCustomers.find(c => c._id === customerId);
      if (!customer) return reject(new Error('Customer not found'));
      const details = mockCustomerDetails[customerId] || {};

      resolve({
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        recentOrders: details.recentOrders || [],
        lifetimeOrders: details.lifetimeOrders || 0,
        lifetimeSpend: details.lifetimeSpend || 0,
        notes: details.notes || ''
      });
    }, 200);
  });
};

// POST /order-delay-alert
export const postOrderDelayAlert = (orderId, reason) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Append order log entry
      dbOrderStatusLogs.push({
        _id: `log-delay-${Date.now()}`,
        orderId,
        status: 'Preparing', // Keep status but add log
        updatedBy: 'System Dispatcher',
        role: 'System',
        remarks: `DELAY ALERT RESOLVED: ${reason}. Escalation notified to Store Manager and rider.`,
        createdAt: new Date().toISOString()
      });
      resolve({ success: true });
    }, 400);
  });
};

// Helper to generate live timeline event logs for streaming
export const getLiveEventsStream = (orderId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'ev-1', event: 'Order Confirmed', time: '16:17 PM', user: 'Amit Malhotra', role: 'Store Manager' },
        { id: 'ev-2', event: 'Preparing Started', time: '16:20 PM', user: 'Chef Harpal', role: 'Kitchen Staff' },
        { id: 'ev-3', event: 'Packed', time: '16:35 PM', user: 'Amit Malhotra', role: 'Store Manager' },
        { id: 'ev-4', event: 'Assigned Rider', time: '16:38 PM', user: 'Allocation Engine', role: 'System' },
        { id: 'ev-5', event: 'Location Updated', time: '16:42 PM', user: 'Rahul Dev', role: 'Rider' },
        { id: 'ev-6', event: 'Out For Delivery', time: '16:46 PM', user: 'Rahul Dev', role: 'Rider' }
      ]);
    }, 200);
  });
};


