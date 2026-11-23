import React from 'react';

// ==========================================
// 1. DATA MODELS & DATASETS (MongoDB )
// ==========================================

export const seedNotifications = [];

// Helper to save notifications to localStorage to mimic DB persistence
const getStoredNotifications = () => {
  const data = localStorage.getItem('pvp_notifications');
  if (!data) {
    localStorage.setItem('pvp_notifications', JSON.stringify(seedNotifications));
    return seedNotifications;
  }
  return JSON.parse(data);
};
const setStoredNotifications = notifications => {
  localStorage.setItem('pvp_notifications', JSON.stringify(notifications));
};

// ==========================================
// 2. Distribution jobs and metrics (kept in this browser only)
// ==========================================

export const seedQueueJobs = [];
export const getStoredQueueJobs = () => {
  const data = localStorage.getItem('pvp_queue_jobs');
  if (!data) {
    localStorage.setItem('pvp_queue_jobs', JSON.stringify(seedQueueJobs));
    return seedQueueJobs;
  }
  return JSON.parse(data);
};
export const setStoredQueueJobs = jobs => {
  localStorage.setItem('pvp_queue_jobs', JSON.stringify(jobs));
};

// ==========================================
// 3. REST API CONTROLLER SIMULATIONS
// ==========================================

export const apiGetNotifications = (filters = {}, pagination = {
  page: 1,
  limit: 10
}, sorting = {
  field: 'createdAt',
  order: 'desc'
}) => {
  return new Promise(resolve => {
    setTimeout(() => {
      let data = [];

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
      const {
        field,
        order
      } = sorting;
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
export const apiGetNotificationById = id => {
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
export const apiCreateNotification = payload => {
  return new Promise(resolve => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const isImmediate = payload.scheduleImmediate;
      const newNotif = {
        _id: "",
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
        sentCount: isImmediate ? 0 : 0,
        deliveredCount: isImmediate ? 0 : 0,
        openedCount: isImmediate ? 0 : 0,
        createdBy: "",
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
export const apiDeleteNotification = id => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const filtered = db.filter(n => n._id !== id);
      if (db.length !== filtered.length) {
        setStoredNotifications(filtered);
        resolve({
          success: true,
          id
        });
      } else {
        reject(new Error('Notification not found'));
      }
    }, 500);
  });
};
export const apiGetNotificationLogs = id => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const notif = db.find(n => n._id === id);
      if (!notif) {
        reject(new Error('Notification not found'));
        return;
      }

      // Generate device logs list
      const deliveryLogs = [];
      resolve({
        notificationId: id,
        title: notif.title,
        kpi: {
          sent: notif.sentCount || 0,
          delivered: notif.deliveredCount || 0,
          failed: notif.sentCount - notif.deliveredCount || 0,
          opened: notif.openedCount || 0,
          successRate: notif.sentCount > 0 ? parseFloat((notif.deliveredCount / notif.sentCount * 100).toFixed(2)) : 0
        },
        logs: deliveryLogs
      });
    }, 700);
  });
};
export const apiGetNotificationAnalytics = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      // 1. Core KPIs
      const kpis = {
        reach: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        failed: 0,
        openRate: 0
      };

      // 2. Delivery Trend (Line Chart Data)
      const deliveryTrend = [];

      // 3. Open Rate Trend (Area Chart Data)
      const openRateTrend = [];

      // 4. Channel Distribution (Donut Chart Data)
      const channelDistribution = [];

      // 5. Success vs Failed (Bar Chart Data)
      const successVsFailed = [];

      // 6. Audience Distribution (Pie Chart Data)
      const audienceRegions = [];
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
  return new Promise(resolve => {
    setTimeout(() => {
      const jobs = getStoredQueueJobs();
      const metrics = {
        queued: jobs.filter(j => j.status === 'Queued').length,
        active: jobs.filter(j => j.status === 'Processing').length,
        completed: jobs.filter(j => j.status === 'Completed').length,
        failed: jobs.filter(j => j.status === 'Failed').length,
        retrying: jobs.filter(j => j.status === 'Retrying').length,
        workersOnline: 0
      };
      resolve({
        metrics,
        jobs
      });
    }, 500);
  });
};
export const apiBulkUpdateNotificationStatus = (ids, status) => {
  return new Promise(resolve => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const updated = db.map(n => ids.includes(n._id) ? {
        ...n,
        status
      } : n);
      setStoredNotifications(updated);
      resolve({
        success: true,
        count: ids.length
      });
    }, 600);
  });
};
export const apiBulkDeleteNotifications = ids => {
  return new Promise(resolve => {
    setTimeout(() => {
      const db = getStoredNotifications();
      const filtered = db.filter(n => !ids.includes(n._id));
      setStoredNotifications(filtered);
      resolve({
        success: true,
        count: ids.length
      });
    }, 650);
  });
};

// ==========================================
// 4. ACTIVE CUSTOMERS LIST SIMULATION
// ==========================================
export const activeCustomerOptions = [];
export const apiSearchCustomers = query => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!query) {
        resolve(activeCustomerOptions);
        return;
      }
      const q = query.toLowerCase();
      resolve(activeCustomerOptions.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)));
    }, 300);
  });
};
