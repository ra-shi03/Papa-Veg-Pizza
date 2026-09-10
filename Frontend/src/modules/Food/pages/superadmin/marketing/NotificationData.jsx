import React from 'react';
import { mockRegions, mockFranchises, mockStores } from './CouponsData';

// ==========================================
// 1. DATA MODELS & DATASETS (MongoDB Mock)
// ==========================================

export const initialNotifications = [
  {
    _id: 'notif-01',
    title: '🍕 Monsoon BOGO Special Alert!',
    message: 'Warm up your rainy days! Buy 1 Get 1 Free on all Medium Thin-crust Pizzas. Offer valid today only across all Delhi-NCR stores.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80&fm=webp',
    type: 'App Push',
    audienceType: 'All Customers',
    customerIds: [],
    regionIds: ['reg-north'],
    franchiseIds: ['fran-delhi-prime'],
    scheduleAt: '2026-06-18T12:00:00.000Z',
    status: 'Sent',
    sentCount: 15400,
    deliveredCount: 15100,
    openedCount: 4200,
    createdBy: 'Siddharth Jamliya (Super)',
    createdAt: '2026-06-18T09:00:00.000Z'
  },
  {
    _id: 'notif-02',
    title: '✨ Flat ₹150 OFF on Gourmet Sides!',
    message: 'Satisfy your cravings! Use coupon GOURMET150 and get flat ₹150 discount on garlic bread, baked pockets & more.',
    image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=600&q=80&fm=webp',
    type: 'SMS',
    audienceType: 'Premium Customers',
    customerIds: [],
    regionIds: ['reg-south'],
    franchiseIds: ['fran-south-crust'],
    scheduleAt: '2026-06-20T17:30:00.000Z',
    status: 'Scheduled',
    sentCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    createdBy: 'Aman Sharma (Super Admin)',
    createdAt: '2026-06-18T10:15:00.000Z'
  },
  {
    _id: 'notif-03',
    title: '🎉 Welcome to Papa Veg Pizza Club!',
    message: 'Flat ₹100 Off on your first order! Relish the premium vegetarian pizzas crafted with organic cheese.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fm=webp',
    type: 'Email',
    audienceType: 'New Customers',
    customerIds: [],
    regionIds: ['reg-north', 'reg-south', 'reg-west', 'reg-east'],
    franchiseIds: [],
    scheduleAt: '2026-06-01T00:00:00.000Z',
    status: 'Sent',
    sentCount: 45000,
    deliveredCount: 43500,
    openedCount: 18200,
    createdBy: 'Pooja Nair (Marketing Mgr)',
    createdAt: '2026-05-25T11:00:00.000Z'
  },
  {
    _id: 'notif-04',
    title: '🏏 IPL Combo Bash Live Tonight!',
    message: 'Order the Cricket Mega Combo (Double Margherita + Paneer Deluxe + Coca Cola) & get free delivery + 20% off!',
    image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&q=80&fm=webp',
    type: 'Multi Channel',
    audienceType: 'Region Wise',
    customerIds: [],
    regionIds: ['reg-west'],
    franchiseIds: ['fran-west-coast'],
    scheduleAt: '2026-06-18T19:00:00.000Z',
    status: 'Processing',
    sentCount: 8500,
    deliveredCount: 2100,
    openedCount: 450,
    createdBy: 'Aman Sharma (Super Admin)',
    createdAt: '2026-06-18T16:00:00.000Z'
  },
  {
    _id: 'notif-05',
    title: '⚠️ Store Maintenance Update - West Region',
    message: 'Our Pune and Bandra outlets will remain closed for monthly kitchen sanitization on 21st June from 2 PM to 5 PM.',
    image: '',
    type: 'App Push',
    audienceType: 'Franchise Wise',
    customerIds: [],
    regionIds: ['reg-west'],
    franchiseIds: ['fran-west-coast', 'fran-pune-tech'],
    scheduleAt: '2026-06-21T09:00:00.000Z',
    status: 'Scheduled',
    sentCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    createdBy: 'Rahul Dravid (Ops Admin)',
    createdAt: '2026-06-17T14:30:00.000Z'
  },
  {
    _id: 'notif-06',
    title: '🍕 Flat 40% OFF Weekend Extravaganza',
    message: 'Save big this weekend! Enjoy 40% flat discount on order above ₹499. Treat your family with premium veg delights.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80&fm=webp',
    type: 'Multi Channel',
    audienceType: 'All Customers',
    customerIds: [],
    regionIds: [],
    franchiseIds: [],
    scheduleAt: '2026-06-14T12:00:00.000Z',
    status: 'Cancelled',
    sentCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    createdBy: 'Pooja Nair (Marketing Mgr)',
    createdAt: '2026-06-12T09:00:00.000Z'
  },
  {
    _id: 'notif-07',
    title: '🔥 Free Stuffed Garlic Breadsticks Deal!',
    message: 'Weekend surprise! Add Garlic Breadsticks to your cart, order for ₹299+ and use code FREEGARLIC. Limited stocks.',
    image: '',
    type: 'App Push',
    audienceType: 'All Customers',
    customerIds: [],
    regionIds: [],
    franchiseIds: [],
    scheduleAt: '2026-06-10T18:00:00.000Z',
    status: 'Failed',
    sentCount: 12000,
    deliveredCount: 450,
    openedCount: 20,
    createdBy: 'Siddharth Jamliya (Super)',
    createdAt: '2026-06-08T10:00:00.000Z'
  }
];

// Helper to save notifications to localStorage to mimic DB persistence
const getStoredNotifications = () => {
  const data = localStorage.getItem('pvp_notifications');
  if (!data) {
    localStorage.setItem('pvp_notifications', JSON.stringify(initialNotifications));
    return initialNotifications;
  }
  return JSON.parse(data);
};

const setStoredNotifications = (notifications) => {
  localStorage.setItem('pvp_notifications', JSON.stringify(notifications));
};

// ==========================================
// 2. DISTRIBUTION JOBS & METRICS MOCK
// ==========================================

export const initialQueueJobs = [
  { jobId: 'job-push-101', title: '🍕 Monsoon BOGO Special Alert!', status: 'Completed', createdAt: '2026-06-18 12:00', attempts: 1, retries: 0, worker: 'worker-push-pool-3', execTime: '450ms' },
  { jobId: 'job-push-102', title: '🏏 IPL Combo Bash Live Tonight!', status: 'Processing', createdAt: '2026-06-18 19:00', attempts: 2, retries: 1, worker: 'worker-push-pool-1', execTime: '120ms' },
  { jobId: 'job-sms-203', title: '✨ Flat ₹150 OFF on Gourmet Sides!', status: 'Queued', createdAt: '2026-06-20 17:30', attempts: 0, retries: 0, worker: 'Unassigned', execTime: '--' },
  { jobId: 'job-push-104', title: '⚠️ Store Maintenance Update - West Region', status: 'Queued', createdAt: '2026-06-21 09:00', attempts: 0, retries: 0, worker: 'Unassigned', execTime: '--' },
  { jobId: 'job-push-105', title: '🔥 Free Stuffed Garlic Breadsticks Deal!', status: 'Failed', createdAt: '2026-06-10 18:00', attempts: 3, retries: 2, worker: 'worker-push-pool-2', execTime: '1850ms' }
];

export const getStoredQueueJobs = () => {
  const data = localStorage.getItem('pvp_queue_jobs');
  if (!data) {
    localStorage.setItem('pvp_queue_jobs', JSON.stringify(initialQueueJobs));
    return initialQueueJobs;
  }
  return JSON.parse(data);
};

export const setStoredQueueJobs = (jobs) => {
  localStorage.setItem('pvp_queue_jobs', JSON.stringify(jobs));
};

// ==========================================
// 3. REST API CONTROLLER SIMULATIONS
// ==========================================

export const apiGetNotifications = (filters = {}, pagination = { page: 1, limit: 10 }, sorting = { field: 'createdAt', order: 'desc' }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let data = [...getStoredNotifications()];

      // 1. Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter(n => n.title.toLowerCase().includes(query));
      }

      // 2. Status
      if (filters.status && filters.status !== 'All') {
        data = data.filter(n => n.status === filters.status);
      }

      // 3. Notification Type
      if (filters.type && filters.type !== 'All') {
        data = data.filter(n => n.type === filters.type);
      }

      // 4. Audience Type
      if (filters.audienceType && filters.audienceType !== 'All') {
        data = data.filter(n => n.audienceType === filters.audienceType);
      }

      // 5. Date filters
      if (filters.startDate) {
        data = data.filter(n => new Date(n.scheduleAt) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        data = data.filter(n => new Date(n.scheduleAt) <= new Date(filters.endDate));
      }

      // 6. Geographic Filters (Region, Franchise)
      if (filters.regionIds && filters.regionIds.length > 0) {
        data = data.filter(n => n.regionIds.some(r => filters.regionIds.includes(r)));
      }
      if (filters.franchiseIds && filters.franchiseIds.length > 0) {
        data = data.filter(n => n.franchiseIds.some(f => filters.franchiseIds.includes(f)));
      }

      // 7. Sorting
      const { field, order } = sorting;
      data.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (field === 'scheduleAt' || field === 'createdAt') {
          valA = new Date(valA || 0);
          valB = new Date(valB || 0);
        }

        if (typeof valA === 'string') {
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return order === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });

      // 8. Pagination
      const totalCount = data.length;
      const startIndex = (pagination.page - 1) * pagination.limit;
      const paginatedData = data.slice(startIndex, startIndex + pagination.limit);

      resolve({
        notifications: paginatedData,
        total: totalCount,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(totalCount / pagination.limit)
      });
    }, 600);
  });
};

export const apiGetNotificationById = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = getStoredNotifications();
      const notif = data.find(n => n._id === id);
      if (notif) {
        resolve(notif);
      } else {
        reject(new Error('Notification not found'));
      }
    }, 300);
  });
};

export const apiCreateNotification = (payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const isImmediate = payload.scheduleImmediate;
      const newNotif = {
        _id: `notif-${Date.now()}`,
        title: payload.title,
        message: payload.message,
        image: payload.image || '',
        type: payload.type,
        audienceType: payload.audienceType,
        customerIds: payload.customerIds || [],
        regionIds: payload.regionIds || [],
        franchiseIds: payload.franchiseIds || [],
        scheduleAt: isImmediate ? new Date().toISOString() : payload.scheduleAt,
        status: payload.status || (isImmediate ? 'Sent' : 'Scheduled'),
        sentCount: isImmediate ? 8000 : 0,
        deliveredCount: isImmediate ? 7600 : 0,
        openedCount: isImmediate ? 1200 : 0,
        createdBy: 'Siddharth Jamliya (Super)',
        createdAt: new Date().toISOString()
      };
      
      db.push(newNotif);
      setStoredNotifications(db);

      // Link to distribution queue simulator
      const q = getStoredQueueJobs();
      q.push({
        jobId: `job-${newNotif.type.toLowerCase().replace(' ', '')}-${Date.now().toString().slice(-4)}`,
        title: newNotif.title,
        status: newNotif.status === 'Sent' ? 'Completed' : 'Queued',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        attempts: newNotif.status === 'Sent' ? 1 : 0,
        retries: 0,
        worker: newNotif.status === 'Sent' ? 'worker-push-pool-3' : 'Unassigned',
        execTime: newNotif.status === 'Sent' ? '240ms' : '--'
      });
      setStoredQueueJobs(q);

      resolve(newNotif);
    }, 800);
  });
};

export const apiUpdateNotification = (id, updatedFields) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const index = db.findIndex(n => n._id === id);
      if (index !== -1) {
        db[index] = {
          ...db[index],
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
        setStoredNotifications(db);
        resolve(db[index]);
      } else {
        reject(new Error('Notification not found'));
      }
    }, 600);
  });
};

export const apiDeleteNotification = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const filtered = db.filter(n => n._id !== id);
      if (db.length !== filtered.length) {
        setStoredNotifications(filtered);
        resolve({ success: true, id });
      } else {
        reject(new Error('Notification not found'));
      }
    }, 500);
  });
};

export const apiGetNotificationLogs = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const notif = db.find(n => n._id === id);
      if (!notif) {
        reject(new Error('Notification not found'));
        return;
      }

      // Generate mock device logs list
      const deliveryLogs = [
        { logId: 'log-101', customer: 'Rahul Sharma', device: 'Android 14 (OnePlus)', channel: notif.type, status: 'Opened', deliveredTime: '2026-06-18 12:05', openedTime: '2026-06-18 12:10', failureReason: '--' },
        { logId: 'log-102', customer: 'Sneha Patel', device: 'iOS 17 (iPhone 15)', channel: notif.type, status: 'Delivered', deliveredTime: '2026-06-18 12:06', openedTime: '--', failureReason: '--' },
        { logId: 'log-103', customer: 'Aarav Mehta', device: 'iOS 17 (iPhone 14 Pro)', channel: notif.type, status: 'Failed', deliveredTime: '--', openedTime: '--', failureReason: 'Device Token Expired' },
        { logId: 'log-104', customer: 'Priya Nair', device: 'Android 13 (Samsung S23)', channel: notif.type, status: 'Opened', deliveredTime: '2026-06-18 12:04', openedTime: '2026-06-18 12:15', failureReason: '--' },
        { logId: 'log-105', customer: 'Amit Gupta', device: 'Android 14 (Google Pixel)', channel: notif.type, status: 'Delivered', deliveredTime: '2026-06-18 12:08', openedTime: '--', failureReason: '--' },
        { logId: 'log-106', customer: 'Diya Sharma', device: 'iOS 16 (iPhone 13)', channel: notif.type, status: 'Failed', deliveredTime: '--', openedTime: '--', failureReason: 'Device Offline Timeout' },
        { logId: 'log-107', customer: 'Vikram Joshi', device: 'Android 13 (Realme)', channel: notif.type, status: 'Opened', deliveredTime: '2026-06-18 12:05', openedTime: '2026-06-18 12:30', failureReason: '--' },
        { logId: 'log-108', customer: 'Karan Malhotra', device: 'iOS 17 (iPhone SE)', channel: notif.type, status: 'Delivered', deliveredTime: '2026-06-18 12:07', openedTime: '--', failureReason: '--' }
      ];

      resolve({
        notificationId: id,
        title: notif.title,
        kpi: {
          sent: notif.sentCount || 10000,
          delivered: notif.deliveredCount || 9500,
          failed: (notif.sentCount - notif.deliveredCount) || 500,
          opened: notif.openedCount || 3000,
          successRate: notif.sentCount > 0 ? parseFloat(((notif.deliveredCount / notif.sentCount) * 100).toFixed(2)) : 0
        },
        logs: deliveryLogs
      });
    }, 700);
  });
};

export const apiGetNotificationAnalytics = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Core KPIs
      const kpis = {
        reach: 120000,
        sent: 100000,
        delivered: 96000,
        opened: 24000,
        failed: 4000,
        openRate: 25.0
      };

      // 2. Delivery Trend (Line Chart Data)
      const deliveryTrend = [
        { date: '06-12', sent: 12000, delivered: 11500 },
        { date: '06-13', sent: 15000, delivered: 14200 },
        { date: '06-14', sent: 14000, delivered: 13500 },
        { date: '06-15', sent: 18000, delivered: 17300 },
        { date: '06-16', sent: 22000, delivered: 21100 },
        { date: '06-17', sent: 20000, delivered: 19400 },
        { date: '06-18', sent: 25000, delivered: 24200 }
      ];

      // 3. Open Rate Trend (Area Chart Data)
      const openRateTrend = [
        { date: '06-12', rate: 21.5 },
        { date: '06-13', rate: 23.0 },
        { date: '06-14', rate: 22.1 },
        { date: '06-15', rate: 25.4 },
        { date: '06-16', rate: 26.0 },
        { date: '06-17', rate: 24.8 },
        { date: '06-18', rate: 27.5 }
      ];

      // 4. Channel Distribution (Donut Chart Data)
      const channelDistribution = [
        { channel: 'App Push', value: 50, color: '#3b82f6' },
        { channel: 'SMS', value: 30, color: '#f97316' },
        { channel: 'Email', value: 20, color: '#a855f7' }
      ];

      // 5. Success vs Failed (Bar Chart Data)
      const successVsFailed = [
        { day: 'Mon', success: 94, failed: 6 },
        { day: 'Tue', success: 92, failed: 8 },
        { day: 'Wed', success: 95, failed: 5 },
        { day: 'Thu', success: 96, failed: 4 },
        { day: 'Fri', success: 93, failed: 7 },
        { day: 'Sat', success: 97, failed: 3 },
        { day: 'Sun', success: 96, failed: 4 }
      ];

      // 6. Audience Distribution (Pie Chart Data)
      const audienceRegions = [
        { name: 'North Region', value: 45, color: '#3b82f6' },
        { name: 'South Region', value: 25, color: '#10b981' },
        { name: 'West Region', value: 20, color: '#f97316' },
        { name: 'East Region', value: 10, color: '#a855f7' }
      ];

      resolve({
        kpis,
        charts: {
          deliveryTrend,
          openRateTrend,
          channelDistribution,
          successVsFailed,
          audienceRegions
        }
      });
    }, 600);
  });
};

export const apiGetQueueMonitor = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const jobs = getStoredQueueJobs();
      
      const metrics = {
        queued: jobs.filter(j => j.status === 'Queued').length,
        active: jobs.filter(j => j.status === 'Processing').length,
        completed: jobs.filter(j => j.status === 'Completed').length,
        failed: jobs.filter(j => j.status === 'Failed').length,
        retrying: jobs.filter(j => j.status === 'Retrying').length,
        workersOnline: 3
      };

      resolve({
        metrics,
        jobs
      });
    }, 500);
  });
};

export const apiBulkUpdateNotificationStatus = (ids, status) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const updated = db.map(n => ids.includes(n._id) ? { ...n, status } : n);
      setStoredNotifications(updated);
      resolve({ success: true, count: ids.length });
    }, 600);
  });
};

export const apiBulkDeleteNotifications = (ids) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const filtered = db.filter(n => !ids.includes(n._id));
      setStoredNotifications(filtered);
      resolve({ success: true, count: ids.length });
    }, 650);
  });
};

// ==========================================
// 4. ACTIVE CUSTOMERS LIST SIMULATION
// ==========================================
export const activeCustomersMock = [
  { id: 'cust-201', name: 'Aarav Sharma', phone: '+91 98765 43210', city: 'Delhi', segment: 'Premium Customers' },
  { id: 'cust-202', name: 'Priya Patel', phone: '+91 87654 32109', city: 'Mumbai', segment: 'New Customers' },
  { id: 'cust-203', name: 'Sneha Gupta', phone: '+91 76543 21098', city: 'Bangalore', segment: 'Premium Customers' },
  { id: 'cust-204', name: 'Rohan Mehta', phone: '+91 65432 10987', city: 'Pune', segment: 'All Customers' },
  { id: 'cust-205', name: 'Amit Nair', phone: '+91 91234 56789', city: 'Chennai', segment: 'New Customers' },
  { id: 'cust-206', name: 'Ananya Sen', phone: '+91 82345 67890', city: 'Kolkata', segment: 'Premium Customers' }
];

export const apiSearchCustomers = (query) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query) {
        resolve(activeCustomersMock);
        return;
      }
      const q = query.toLowerCase();
      resolve(
        activeCustomersMock.filter(c => 
          c.name.toLowerCase().includes(q) || 
          c.phone.includes(q)
        )
      );
    }, 300);
  });
};
