import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, Clock, Star, MapPin, Package, ClipboardList, ShieldAlert, Trophy, Trash2, Edit, Plus, FileText, CheckCircle2, ChevronRight, Check, Eye } from "lucide-react";
import { AddNoteModal, EditCustomerModal } from "./Modals";
import { AddAddressModal, AdjustPointsModal, OrderDetailsModal, ComplaintDetailsModal } from "./DetailModals";
import { mockStores } from "../mockData";

// Helper to format date nicely
const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
};

export default function CustomerDrawer({
  isOpen,
  onClose,
  customerId,
  useCustomersHook
}) {
  const {
    customerDetails,
    loadingDetails,
    fetchCustomerDetails,
    updateCustomer,
    adjustPoints,
    addNote,
    deleteNote,
    addAddress,
    setDefaultAddress,
    deleteAddress
  } = useCustomersHook;

  const [activeTab, setActiveTab] = useState("Profile");
  
  // Local Modal States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAdjustPoints, setShowAdjustPoints] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Pagination for order history
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails(customerId);
      setActiveTab("Profile");
      setOrderPage(1);
    }
  }, [isOpen, customerId, fetchCustomerDetails]);

  if (!isOpen) return null;

  const tabs = [
    { name: "Profile", icon: User },
    { name: "Order History", icon: Package },
    { name: "Addresses", icon: MapPin },
    { name: "Reviews", icon: Star },
    { name: "Loyalty Points", icon: Trophy },
    { name: "Complaints", icon: ShieldAlert },
    { name: "Internal Notes", icon: ClipboardList }
  ];

  // Loyalty Tier calculation helper
  const getLoyaltyTier = (points) => {
    if (points >= 1000) return { name: "Platinum", color: "from-purple-500 to-indigo-600 text-white", border: "border-purple-300", percent: 100 };
    if (points >= 300) return { name: "Gold", color: "from-amber-400 to-amber-600 text-white", border: "border-amber-300", percent: Math.min(100, Math.round(((points - 300) / 700) * 100)) };
    return { name: "Silver", color: "from-zinc-400 to-zinc-550 text-white", border: "border-zinc-300", percent: Math.min(100, Math.round((points / 300) * 100)) };
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel (90% width) */}
      <div className="relative w-full max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[65%] h-full bg-slate-50 dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-10 animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              {customerDetails?.fullName
                ? customerDetails.fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
                : "CU"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">{customerDetails?.fullName || "Loading details..."}</h3>
                {customerDetails?.customerType === "VIP" && (
                  <span className="px-1.5 py-0.2 rounded-md text-[8px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400">VIP BADGE</span>
                )}
                <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-bold ${customerDetails?.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-950/20" : "bg-rose-100 text-rose-700 dark:bg-rose-950/20"}`}>
                  {customerDetails?.status || "Loading..."}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">ID: {customerDetails?._id || customerId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-850 px-4 overflow-x-auto scrollbar-none gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-3 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${isSelected ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
              >
                <Icon size={12} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {loadingDetails ? (
            <div className="h-48 flex items-center justify-center flex-col gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
              <p className="text-xs text-zinc-400">Fetching customer analytics...</p>
            </div>
          ) : customerDetails ? (
            <>
              {/* TAB 1: PROFILE */}
              {activeTab === "Profile" && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Quick stats Bento */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs">
                      <p className="text-[10px] font-bold text-zinc-450 uppercase">Total orders placed</p>
                      <p className="text-xl font-black text-zinc-855 dark:text-white mt-1">{customerDetails.totalOrders || 0}</p>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full mt-3 overflow-hidden">
                        <div className="bg-blue-500 h-full w-[40%]" />
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs">
                      <p className="text-[10px] font-bold text-zinc-450 uppercase">Lifetime revenue</p>
                      <p className="text-xl font-black text-[var(--primary)] mt-1">₹{(customerDetails.totalSpent || 0).toLocaleString('en-IN')}</p>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full mt-3 overflow-hidden">
                        <div className="bg-[var(--primary)] h-full w-[65%]" />
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs">
                      <p className="text-[10px] font-bold text-zinc-450 uppercase">Avg order value (AOV)</p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1">₹{(customerDetails.avgOrderValue || 0).toLocaleString('en-IN')}</p>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[50%]" />
                      </div>
                    </div>
                  </div>

                  {/* Profile info cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* General details */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-3.5">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200">Account details</h4>
                        <button 
                          onClick={() => setShowEditProfile(true)}
                          className="flex items-center gap-1 text-[9px] font-bold text-[var(--primary)] hover:underline"
                        >
                          <Edit size={11} />
                          Edit Profile
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Email Address</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">{customerDetails.email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Mobile Number</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{customerDetails.mobile}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Joined On</p>
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{formatDateTime(customerDetails.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Last Login</p>
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{formatDateTime(customerDetails.lastLogin)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Verification status</p>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold mt-1 ${customerDetails.isVerified ? "bg-green-100 text-green-700 dark:bg-green-950/20" : "bg-amber-100 text-amber-700 dark:bg-amber-950/20"}`}>
                            {customerDetails.isVerified ? "Verified Account" : "Pending Verification"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Favorite store outlet</p>
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                            {mockStores.find(s => s.id === customerDetails.favoriteStoreId)?.name || "Indore Central"}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="pt-2">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1.5">Assigned Tags</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {customerDetails.tags?.length > 0 ? (
                            customerDetails.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">No tags assigned.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Activity logs */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col h-[280px]">
                      <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200 pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-3 shrink-0">Recent activity logs</h4>
                      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-100 dark:before:bg-zinc-800">
                        {customerDetails.activities?.length > 0 ? (
                          customerDetails.activities.map((act, idx) => (
                            <div key={idx} className="flex gap-3 relative z-10">
                              <div className="w-4 h-4 rounded-full border border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shadow-xs mt-0.5 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-baseline gap-2">
                                  <p className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px] truncate">{act.activityType}</p>
                                  <span className="text-[8px] text-zinc-400 shrink-0">{formatDateTime(act.createdAt)}</span>
                                </div>
                                <p className="text-[10px] text-zinc-450 mt-0.5 leading-normal">{act.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-zinc-400">No activity registered.</div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === "Order History" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200">Customer orders ledger</h4>
                    <span className="text-[10px] font-bold text-zinc-400">Total orders: {customerDetails.orders?.length || 0}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800 text-[9px] uppercase tracking-wider font-bold text-zinc-400">
                          <th className="px-3 py-2.5">Order No</th>
                          <th className="px-3 py-2.5">Store Outlet</th>
                          <th className="px-3 py-2.5 text-right">Amount</th>
                          <th className="px-3 py-2.5">Payment Method</th>
                          <th className="px-3 py-2.5">Order Status</th>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                        {customerDetails.orders?.length > 0 ? (
                          customerDetails.orders
                            .slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage)
                            .map((order) => (
                              <tr key={order._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                                <td className="px-3 py-3 font-bold text-zinc-800 dark:text-zinc-200">{order.orderNumber}</td>
                                <td className="px-3 py-3 font-semibold text-zinc-650 dark:text-zinc-350">{order.storeName}</td>
                                <td className="px-3 py-3 text-right font-bold text-zinc-900 dark:text-white">₹{order.amount}</td>
                                <td className="px-3 py-3 font-medium text-zinc-500">{order.paymentMethod}</td>
                                <td className="px-3 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${order.orderStatus === "delivered" ? "bg-green-150 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"}`}>
                                    {order.orderStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-zinc-450">{formatDateTime(order.date)}</td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-1 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                                  >
                                    <Eye size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-zinc-400 italic">No orders registered for this customer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  {customerDetails.orders?.length > ordersPerPage && (
                    <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-bold">
                      <button
                        disabled={orderPage === 1}
                        onClick={() => setOrderPage(orderPage - 1)}
                        className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-50"
                      >
                        Prev Page
                      </button>
                      <span>Page {orderPage} of {Math.ceil(customerDetails.orders.length / ordersPerPage)}</span>
                      <button
                        disabled={orderPage * ordersPerPage >= customerDetails.orders.length}
                        onClick={() => setOrderPage(orderPage + 1)}
                        className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-50"
                      >
                        Next Page
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: ADDRESSES */}
              {activeTab === "Addresses" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs">
                    <div>
                      <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200">Customer Addresses</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Manage delivery routes & address settings</p>
                    </div>
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Add Address
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customerDetails.addresses?.length > 0 ? (
                      customerDetails.addresses.map((addr) => (
                        <div key={addr._id} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)]">
                                {addr.addressType}
                              </span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-zinc-850 dark:text-zinc-150">{addr.recipientName}</p>
                            <p className="text-[10px] text-zinc-450 mt-1 flex items-center gap-1"><Phone size={10} /> {addr.phone}</p>
                            <p className="text-xs text-zinc-650 dark:text-zinc-350 mt-2 font-medium">
                              {addr.houseNumber}, {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                              {addr.landmark && <span className="block text-[10px] text-zinc-400 italic">Landmark: {addr.landmark}</span>}
                            </p>
                            <p className="text-[9px] text-zinc-400 mt-2">Coords: {addr.latitude}, {addr.longitude}</p>
                          </div>

                          <div className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-3">
                            {!addr.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(customerDetails._id, addr._id)}
                                className="flex-1 py-1 bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300 font-bold rounded-md transition-all"
                              >
                                Set default
                              </button>
                            )}
                            <button
                              onClick={() => deleteAddress(customerDetails._id, addr._id)}
                              className="px-2 py-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-md transition-all"
                              title="Delete Address"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 rounded-xl text-center text-zinc-450 italic font-medium">
                        No delivery addresses registered on this account.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: REVIEWS */}
              {activeTab === "Reviews" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-4 animate-fade-in">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    Product reviews ledger
                  </h4>

                  <div className="space-y-3">
                    {customerDetails.reviews?.length > 0 ? (
                      customerDetails.reviews.map((rev) => (
                        <div key={rev._id} className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-xl relative hover:scale-[1.005] transition-all">
                          <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                            <div>
                              <p className="font-bold text-zinc-850 dark:text-zinc-150">{rev.productName}</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5">{rev.storeName}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  size={12}
                                  className={idx < rev.rating ? "fill-amber-400 stroke-amber-400" : "text-zinc-300"}
                                />
                              ))}
                              <span className="text-[9px] text-zinc-450 font-bold ml-1">{formatDateTime(rev.date)}</span>
                            </div>
                          </div>
                          <p className="text-zinc-650 dark:text-zinc-350 italic font-semibold">"{rev.reviewText}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-400 italic font-medium">No reviews published by this customer.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: LOYALTY POINTS */}
              {activeTab === "Loyalty Points" && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Progress Card */}
                  {(() => {
                    const tier = getLoyaltyTier(customerDetails.loyaltyPoints || 0);
                    return (
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-400">Current loyalty profile</h4>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[var(--primary)]">{customerDetails.loyaltyPoints || 0}</span>
                            <span className="text-xs font-bold text-zinc-400">Reward Points</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Tier status: {tier.name}
                            </span>
                            <span className="text-[10px] text-zinc-450 font-bold">Progress to next tier: {tier.percent}%</span>
                          </div>
                          <div className="w-48 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-[var(--primary)] h-full transition-all" style={{ width: `${tier.percent}%` }} />
                          </div>
                        </div>

                        <button
                          onClick={() => setShowAdjustPoints(true)}
                          className="px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all"
                        >
                          Adjust Points balance
                        </button>
                      </div>
                    );
                  })()}

                  {/* Transactions ledger */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs">
                    <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200 pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-3">
                      Loyalty point ledgers
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800 text-[9px] uppercase tracking-wider font-bold text-zinc-400">
                            <th className="px-3 py-2">Transaction Detail</th>
                            <th className="px-3 py-2 text-right">Earned</th>
                            <th className="px-3 py-2 text-right">Redeemed</th>
                            <th className="px-3 py-2 text-right">Balance</th>
                            <th className="px-3 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-medium">
                          {customerDetails.loyaltyTransactions?.length > 0 ? (
                            customerDetails.loyaltyTransactions.map((txn, index) => (
                              <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                                <td className="px-3 py-3">
                                  <p className="font-bold text-zinc-850 dark:text-zinc-150">{txn.source}</p>
                                  <p className="text-[9px] text-zinc-450 mt-0.5">{txn.remarks}</p>
                                </td>
                                <td className="px-3 py-3 text-right font-black text-emerald-600">
                                  {txn.pointsEarned > 0 ? `+${txn.pointsEarned}` : "-"}
                                </td>
                                <td className="px-3 py-3 text-right font-black text-rose-500">
                                  {txn.pointsRedeemed > 0 ? `-${txn.pointsRedeemed}` : "-"}
                                </td>
                                <td className="px-3 py-3 text-right font-black text-zinc-900 dark:text-white">
                                  {txn.balance}
                                </td>
                                <td className="px-3 py-3 text-zinc-450">{formatDateTime(txn.date)}</td>
                              </tr>
                            ))
                          ) : (
                            // Fallback to mock search in sessionStorage DB for loyalty transactions
                            JSON.parse(localStorage.getItem("pv_loyalty_transactions") || "[]")
                              .filter(txn => txn.customerId === customerDetails._id)
                              .map((txn, index) => (
                                <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                                  <td className="px-3 py-3">
                                    <p className="font-bold text-zinc-850 dark:text-zinc-150">{txn.source}</p>
                                    <p className="text-[9px] text-zinc-450 mt-0.5">{txn.remarks}</p>
                                  </td>
                                  <td className="px-3 py-3 text-right font-black text-emerald-600">
                                    {txn.pointsEarned > 0 ? `+${txn.pointsEarned}` : "-"}
                                  </td>
                                  <td className="px-3 py-3 text-right font-black text-rose-500">
                                    {txn.pointsRedeemed > 0 ? `-${txn.pointsRedeemed}` : "-"}
                                  </td>
                                  <td className="px-3 py-3 text-right font-black text-zinc-900 dark:text-white">
                                    {txn.balance}
                                  </td>
                                  <td className="px-3 py-3 text-zinc-450">{formatDateTime(txn.date)}</td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 6: COMPLAINTS */}
              {activeTab === "Complaints" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs space-y-4 animate-fade-in">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    Complaints & Support Tickets
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[550px]">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-800 text-[9px] uppercase tracking-wider font-bold text-zinc-400">
                          <th className="px-3 py-2.5">Ticket ID</th>
                          <th className="px-3 py-2.5">Category</th>
                          <th className="px-3 py-2.5">Priority</th>
                          <th className="px-3 py-2.5">Assigned To</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5">Date Created</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                        {customerDetails.complaints?.length > 0 ? (
                          customerDetails.complaints.map((comp) => (
                            <tr key={comp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                              <td className="px-3 py-3 font-bold text-zinc-805 dark:text-zinc-205">{comp.complaintNumber}</td>
                              <td className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300">{comp.category}</td>
                              <td className="px-3 py-3 font-semibold text-zinc-750 dark:text-zinc-350">
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${comp.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                                  {comp.priority}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-medium text-zinc-550">{comp.assignedTo}</td>
                              <td className="px-3 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${comp.status === "Resolved" ? "bg-green-150 text-green-700 dark:bg-green-950/20" : "bg-rose-100 text-rose-700 dark:bg-rose-950/20"}`}>
                                  {comp.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-zinc-450">{formatDateTime(comp.createdDate)}</td>
                              <td className="px-3 py-3 text-center">
                                <button
                                  onClick={() => setSelectedComplaint(comp)}
                                  className="p-1 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-250 transition-colors"
                                >
                                  <Eye size={12} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-zinc-400 italic">No tickets raised by this customer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: INTERNAL NOTES */}
              {activeTab === "Internal Notes" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs">
                    <div>
                      <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200">Internal Admin Notes</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Notes private to franchise staff and supervisors</p>
                    </div>
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="px-3 py-1.5 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Add Note
                    </button>
                  </div>

                  <div className="space-y-3">
                    {customerDetails.notes?.length > 0 ? (
                      customerDetails.notes.map((note) => (
                        <div key={note.id} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-xl shadow-xs flex justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-zinc-800 dark:text-zinc-200 font-semibold">"{note.note}"</p>
                            <p className="text-[9px] text-zinc-400 font-bold">Recorded by {note.createdBy} on {formatDateTime(note.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => deleteNote(customerDetails._id, note.id)}
                            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded p-1.5 h-fit transition-colors shrink-0"
                            title="Delete Note"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 rounded-xl text-center text-zinc-450 italic font-medium">
                        No team notes recorded on this customer profile.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="text-center text-zinc-450 py-12 italic">Could not fetch analytics profile.</div>
          )}
        </div>

      </div>

      {/* Embedded Dialogs/Modals */}
      <EditCustomerModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        customer={customerDetails}
        onSave={updateCustomer}
      />
      <AddAddressModal
        isOpen={showAddAddress}
        onClose={() => setShowAddAddress(false)}
        customerId={customerId}
        onAdd={addAddress}
      />
      <AdjustPointsModal
        isOpen={showAdjustPoints}
        onClose={() => setShowAdjustPoints(false)}
        customerId={customerId}
        onAdjust={adjustPoints}
      />
      <AddNoteModal
        isOpen={showAddNote}
        onClose={() => setShowAddNote(false)}
        customerId={customerId}
        onAdd={addNote}
      />
      <OrderDetailsModal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
      <ComplaintDetailsModal
        isOpen={selectedComplaint !== null}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
      />
    </div>
  );
}
