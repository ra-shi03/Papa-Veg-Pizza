import { useState, useEffect } from 'react';

// MOCK SUPPORT AGENTS
export const mockSupportAgents = [
  { _id: 'AGT-001', name: 'Rohan Patil', role: 'Level 1 Specialist', status: 'Active' },
  { _id: 'AGT-002', name: 'Kiran Deshmukh', role: 'Escalation Supervisor', status: 'Active' },
  { _id: 'AGT-003', name: 'Sneha Rao', role: 'Operations Lead', status: 'Active' },
  { _id: 'AGT-004', name: 'Rajiv Malhotra', role: 'Legal Advisor', status: 'Active' }
];

// MOCK STORES
export const mockStores = {
  'STORE-001': { _id: 'STORE-001', name: 'Papa Veg Bandra', manager: 'Sanjay Dutt', phone: '+91 99331-22445', address: 'Hill Road, Bandra West, Mumbai, MH - 400050' },
  'STORE-002': { _id: 'STORE-002', name: 'Papa Veg Indiranagar', manager: 'Karthik Raja', phone: '+91 99442-11335', address: '100ft Road, Indiranagar, Bengaluru, KA - 560038' },
  'STORE-003': { _id: 'STORE-003', name: 'Papa Veg Noida Sec-15', manager: 'Amit Saxena', phone: '+91 99553-00225', address: 'Block B, Sector 15, Noida, UP - 201301' }
};

// MOCK FRANCHISES
export const mockFranchises = {
  'FRAN-001': { _id: 'FRAN-001', name: 'Mumbai Express Pizza Corp', owner: 'Vikram Phadke', phone: '+91 98221-55443' },
  'FRAN-002': { _id: 'FRAN-002', name: 'South India Foods Ltd', owner: 'Aravind Swamy', phone: '+91 98332-66554' },
  'FRAN-003': { _id: 'FRAN-003', name: 'North Veg Hubs', owner: 'Jaspal Singh', phone: '+91 98443-77665' }
};

// MOCK RIDERS
export const mockRiders = {
  'RIDER-001': { _id: 'RIDER-001', name: 'Suraj Chauhan', phone: '+91 88123-45678', vehicleNumber: 'MH-02-EE-4521' },
  'RIDER-002': { _id: 'RIDER-002', name: 'Manpreet Singh', phone: '+91 88234-56789', vehicleNumber: 'KA-03-HJ-9087' },
  'RIDER-003': { _id: 'RIDER-003', name: 'Ramesh Yadav', phone: '+91 88345-67890', vehicleNumber: 'UP-16-DK-2314' }
};

// MOCK CUSTOMERS
export const mockCustomers = {
  'CUST-001': { _id: 'CUST-001', name: 'Rajesh Kumar', phone: '+91 98765-43210', email: 'rajesh.kumar@gmail.com', address: 'Apt 402, Sea Breeze Heights, Bandra West, Mumbai, MH - 400050', lifetimeOrders: 42 },
  'CUST-002': { _id: 'CUST-002', name: 'Priya Patel', phone: '+91 99887-76655', email: 'priya.patel@yahoo.com', address: 'House No 12, GIDC Colony, Satellite, Ahmedabad, GJ - 380015', lifetimeOrders: 18 },
  'CUST-003': { _id: 'CUST-003', name: 'Aarav Mehta', phone: '+91 91234-56789', email: 'aarav.mehta@outlook.com', address: 'Block C-3, Prestige Residency, Indiranagar, Bengaluru, KA - 560038', lifetimeOrders: 31 }
};

// MOCK ORDERS
export const mockOrders = {
  'ORD-101': {
    _id: 'ORD-101',
    orderNumber: 'PV-101',
    grandTotal: 749.00,
    paymentMethod: 'Prepaid (UPI)',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    deliveryStatus: 'Delivered',
    couponApplied: 'PIZZALOVE',
    deliveryAddress: 'Apt 402, Sea Breeze Heights, Bandra West, Mumbai, MH - 400050',
    items: [
      { product: 'Papa Paneer Tikka Feast', variant: 'Medium', qty: 1, price: 449.00, subtotal: 449.00 },
      { product: 'Stuffed Garlic Bread', variant: 'Classic', qty: 2, price: 150.00, subtotal: 300.00 }
    ]
  },
  'ORD-102': {
    _id: 'ORD-102',
    orderNumber: 'PV-102',
    grandTotal: 590.00,
    paymentMethod: 'Prepaid (Card)',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    deliveryStatus: 'Delivered',
    couponApplied: 'WELCOME50',
    deliveryAddress: 'Block C-3, Prestige Residency, Indiranagar, Bengaluru, KA - 560038',
    items: [
      { product: 'Double Cheese Margherita', variant: 'Large', qty: 1, price: 540.00, subtotal: 540.00 },
      { product: 'Coke', variant: '500ml', qty: 1, price: 50.00, subtotal: 50.00 }
    ]
  },
  'ORD-103': {
    _id: 'ORD-103',
    orderNumber: 'PV-103',
    grandTotal: 340.00,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    orderStatus: 'Cancelled',
    deliveryStatus: 'Failed',
    couponApplied: 'None',
    deliveryAddress: 'Flat 101, Rosewood Apartments, Sector 15, Noida, UP - 201301',
    items: [
      { product: 'Farm Villa Veggie Pizza', variant: 'Medium', qty: 1, price: 340.00, subtotal: 340.00 }
    ]
  }
};

// INITIAL DISPUTES DATABASE
let mockDisputes = [
  {
    _id: 'DSP-22109',
    disputeNumber: 'DSP-22109',
    orderId: 'ORD-101',
    raisedById: 'CUST-001',
    raisedByRole: 'Customer',
    type: 'Wrong Pizza Delivered',
    priority: 'High',
    description: 'Delivered item did not have paneer. It was a plain cheese Margherita instead of Paneer Tikka Feast.',
    status: 'open',
    assignedTo: '',
    resolutionType: '',
    resolutionNotes: '',
    createdAt: '2026-06-18T14:30:00Z',
    deadline: '2026-06-18T18:30:00Z', // 4 Hour SLA
    evidence: [
      { _id: 'EVD-001', category: 'Images', name: 'wrong_pizza_box.webp', size: '124 KB', uploadDate: '2026-06-18T14:32:00Z', uploadedBy: 'Rajesh Kumar', url: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&q=80&w=300' }
    ],
    messages: [
      { _id: 'MSG-001', sender: 'Rajesh Kumar', role: 'Customer', message: 'I ordered the Premium Paneer Tikka Pizza, but received a simple cheese pizza. Please check my attached photo.', timestamp: '2026-06-18T14:32:00Z' }
    ],
    logs: [
      { status: 'Open', changedBy: 'System Trigger', role: 'System Automated', remarks: 'Dispute claim filed by customer via mobile application.', timestamp: '2026-06-18T14:30:00Z' }
    ],
    notes: [
      { _id: 'NTE-001', note: 'Kitchen check shows paneer stock ran out at 14:15. This claim is highly likely correct.', createdBy: 'Amit Patel', role: 'Store Auditor', createdTime: '2026-06-18T14:45:00Z' }
    ]
  },
  {
    _id: 'DSP-22108',
    disputeNumber: 'DSP-22108',
    orderId: 'ORD-102',
    raisedById: 'CUST-002',
    raisedByRole: 'Customer',
    type: 'Late Delivery',
    priority: 'Medium',
    description: 'Pizza delivered cold and delayed by 45 minutes.',
    status: 'assigned',
    assignedTo: 'AGT-001',
    resolutionType: '',
    resolutionNotes: '',
    createdAt: '2026-06-18T11:00:00Z',
    deadline: '2026-06-18T17:00:00Z',
    evidence: [],
    messages: [
      { _id: 'MSG-002', sender: 'Priya Patel', role: 'Customer', message: 'The app showed 30 minutes, but it took 1 hour 15 minutes. Pizza was completely cold.', timestamp: '2026-06-18T11:05:00Z' },
      { _id: 'MSG-003', sender: 'Rohan Patil', role: 'Agent', message: 'Hi Priya, I am reviewing the GPS trails for this delivery run to identify where the delay occurred.', timestamp: '2026-06-18T11:20:00Z' }
    ],
    logs: [
      { status: 'Open', changedBy: 'System Trigger', role: 'System Automated', remarks: 'Dispute filed.', timestamp: '2026-06-18T11:00:00Z' },
      { status: 'Assigned', changedBy: 'System Auto-Allocator', role: 'System', remarks: 'Assigned to Level 1 Agent Rohan Patil.', timestamp: '2026-06-18T11:10:00Z' }
    ],
    notes: []
  },
  {
    _id: 'DSP-22107',
    disputeNumber: 'DSP-22107',
    orderId: 'ORD-103',
    raisedById: 'RIDER-003',
    raisedByRole: 'Rider',
    type: 'Rider Behavior',
    priority: 'Critical',
    description: 'Store manager abused and refused to hand over order to the rider.',
    status: 'escalated',
    assignedTo: 'AGT-003',
    resolutionType: '',
    resolutionNotes: '',
    createdAt: '2026-06-17T18:00:00Z',
    deadline: '2026-06-17T22:00:00Z',
    evidence: [
      { _id: 'EVD-002', category: 'Documents', name: 'store_incident_report.pdf', size: '42 KB', uploadDate: '2026-06-17T18:15:00Z', uploadedBy: 'Ramesh Yadav', url: '#' }
    ],
    messages: [
      { _id: 'MSG-004', sender: 'Ramesh Yadav', role: 'Rider', message: 'Manager told me to wait outside in heavy rain and used abusive language when I requested shelter.', timestamp: '2026-06-17T18:05:00Z' },
      { _id: 'MSG-005', sender: 'Sanjay Dutt', role: 'Store Manager', message: 'The rider was shouting inside the kitchen space creating safety hazards.', timestamp: '2026-06-17T18:25:00Z' }
    ],
    logs: [
      { status: 'Open', changedBy: 'System Trigger', role: 'System Automated', remarks: 'Dispute filed by Rider.', timestamp: '2026-06-17T18:00:00Z' },
      { status: 'Assigned', changedBy: 'Shubham Jamliya', role: 'Super Admin', remarks: 'Assigned to Sneha Rao.', timestamp: '2026-06-17T18:30:00Z' },
      { status: 'Escalated', changedBy: 'Sneha Rao', role: 'Operations Lead', remarks: 'Escalated to Management level due to physical threat claims.', timestamp: '2026-06-17T19:00:00Z' }
    ],
    notes: [
      { _id: 'NTE-002', note: 'Escalated to legal and franchise operations to verify store CCTV footages.', createdBy: 'Sneha Rao', role: 'Operations Lead', createdTime: '2026-06-17T19:05:00Z' }
    ]
  }
];

// MOCK DISPUTE ACTIVITY LOGS (AUDIT TABLE SOURCE)
export const mockDisputeActivityLogs = [
  { action: 'CREATE_DISPUTE', user: 'System Trigger', role: 'System Automated', timestamp: '2026-06-18T14:30:00Z', ipAddress: '192.168.1.1', remarks: 'Dispute DSP-22109 initialized' },
  { action: 'ASSIGN_AGENT', user: 'System Auto-Allocator', role: 'System', timestamp: '2026-06-18T11:10:00Z', ipAddress: '192.168.1.1', remarks: 'Assigned DSP-22108 to Rohan Patil' },
  { action: 'ESCALATE_DISPUTE', user: 'Sneha Rao', role: 'Operations Lead', timestamp: '2026-06-17T19:00:00Z', ipAddress: '192.168.1.12', remarks: 'Escalated DSP-22107 to Management' }
];

// API SIMULATIONS
export const getDisputes = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockDisputes]);
    }, 400);
  });
};

export const getDisputeDetails = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dispute = mockDisputes.find(d => d._id === id);
      if (!dispute) {
        reject(new Error('Dispute not found'));
        return;
      }
      
      const order = mockOrders[dispute.orderId] || null;
      const customer = mockCustomers[dispute.raisedById] || mockCustomers['CUST-001'];
      const store = mockStores['STORE-001'];
      const franchise = mockFranchises['FRAN-001'];
      const rider = mockRiders['RIDER-001'];
      
      resolve({
        ...dispute,
        order,
        customer,
        store,
        franchise,
        rider
      });
    }, 300);
  });
};

export const assignDispute = (id, agentId, priority, deadline, notes, user = 'Shubham Jamliya', role = 'Super Admin') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dispute = mockDisputes.find(d => d._id === id);
      const agent = mockSupportAgents.find(a => a._id === agentId);
      
      if (dispute && agent) {
        dispute.status = 'assigned';
        dispute.assignedTo = agent.name;
        dispute.priority = priority;
        dispute.deadline = deadline;
        
        dispute.logs.push({
          status: 'Assigned',
          changedBy: user,
          role: role,
          remarks: `Assigned to ${agent.name}. Priority set to ${priority}. Notes: ${notes}`,
          timestamp: new Date().toISOString()
        });

        mockDisputeActivityLogs.unshift({
          action: 'ASSIGN_AGENT',
          user: user,
          role: role,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.10',
          remarks: `Assigned dispute ${id} to ${agent.name}`
        });
      }
      resolve({ success: true, dispute: { ...dispute } });
    }, 500);
  });
};

export const escalateDispute = (id, level, reason, priority, user = 'Shubham Jamliya', role = 'Super Admin') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dispute = mockDisputes.find(d => d._id === id);
      if (dispute) {
        dispute.status = 'escalated';
        dispute.priority = priority;
        
        dispute.logs.push({
          status: 'Escalated',
          changedBy: user,
          role: role,
          remarks: `Escalated to ${level}. Reason: ${reason}. Priority upgraded to ${priority}.`,
          timestamp: new Date().toISOString()
        });

        mockDisputeActivityLogs.unshift({
          action: 'ESCALATE_DISPUTE',
          user: user,
          role: role,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.10',
          remarks: `Escalated dispute ${id} to ${level}`
        });
      }
      resolve({ success: true, dispute: { ...dispute } });
    }, 500);
  });
};

export const resolveDispute = (id, type, amount, coupon, notes, notifyChecked, user = 'Shubham Jamliya', role = 'Super Admin') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dispute = mockDisputes.find(d => d._id === id);
      if (dispute) {
        dispute.status = 'resolved';
        dispute.resolutionType = type;
        dispute.resolutionNotes = notes;
        
        dispute.logs.push({
          status: 'Resolved',
          changedBy: user,
          role: role,
          remarks: `Resolved via ${type}. Refund/Coupon Compensation: ₹${amount || 0}. Coupon Code: ${coupon || 'N/A'}. Resolution Notes: ${notes}`,
          timestamp: new Date().toISOString()
        });

        mockDisputeActivityLogs.unshift({
          action: 'RESOLVE_DISPUTE',
          user: user,
          role: role,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.10',
          remarks: `Resolved dispute ${id} via ${type}`
        });
      }
      resolve({ success: true, dispute: { ...dispute } });
    }, 500);
  });
};

export const closeDispute = (id, remarks, user = 'Shubham Jamliya', role = 'Super Admin') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dispute = mockDisputes.find(d => d._id === id);
      if (dispute) {
        dispute.status = 'closed';
        dispute.resolutionNotes = remarks;
        
        dispute.logs.push({
          status: 'Closed',
          changedBy: user,
          role: role,
          remarks: `Closed dispute. Closing remarks: ${remarks}`,
          timestamp: new Date().toISOString()
        });

        mockDisputeActivityLogs.unshift({
          action: 'CLOSE_DISPUTE',
          user: user,
          role: role,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.10',
          remarks: `Closed dispute ${id}`
        });
      }
      resolve({ success: true, dispute: { ...dispute } });
    }, 500);
  });
};

export const postInternalNote = (id, noteText, user = 'Shubham Jamliya', role = 'Super Admin') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dispute = mockDisputes.find(d => d._id === id);
      const newNote = {
        _id: `NTE-${Date.now()}`,
        note: noteText,
        createdBy: user,
        role: role,
        createdTime: new Date().toISOString()
      };
      if (dispute) {
        dispute.notes.push(newNote);
      }
      resolve({ success: true, note: newNote });
    }, 300);
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
