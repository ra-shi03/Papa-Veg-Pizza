import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { RefreshCw, FileDown, Download, Users, Check, Clock } from "lucide-react";
import { toast } from "sonner";

// Custom Hooks & Sub-components
import { useCustomerOrdersList } from "./hooks/useCustomerOrders";
import CustomerStatsCards from "./components/CustomerStatsCards";
import CustomerFilters from "./components/CustomerFilters";
import CustomerOrdersTable from "./components/CustomerOrdersTable";

// Modals
import CustomerProfileModal from "./components/CustomerProfileModal";
import CustomerOrderHistoryModal from "./components/CustomerOrderHistoryModal";
import OrderDetailsModal from "./components/OrderDetailsModal";
import RefundHistoryModal from "./components/RefundHistoryModal";
import OrderTimelineModal from "./components/OrderTimelineModal";
import DownloadInvoiceModal from "../orders/components/DownloadInvoiceModal";

// Local fallback mock database imports for real-time stats calculation
import { mockCustomers, mockOrders } from "./mockData";

export default function CustomerOrders() {
  const { role } = useOutletContext(); // Retrieve user role from outlet context

  // ----------------------------------------------------
  // States: Filters, Pagination & Sorting
  // ----------------------------------------------------
  const [filters, setFilters] = useState({
    search: "",
    orderNumber: "",
    status: "All",
    paymentStatus: "All",
    startDate: "",
    endDate: "",
    returning: false,
    highValue: false,
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc"
  });

  // ----------------------------------------------------
  // States: Modal Visibility & Selected Items
  // ----------------------------------------------------
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const [modalVisibility, setModalVisibility] = useState({
    profile: false,
    orderDetails: false,
    orderHistory: false,
    refundHistory: false,
    timeline: false,
    invoice: false
  });

  // Fetch paginated customer orders data
  const { data, isLoading, isError, refetch } = useCustomerOrdersList(filters);

  // ----------------------------------------------------
  // Dynamic Real-time Stats Calculation (Independent of table filters)
  // ----------------------------------------------------
  const stats = useMemo(() => {
    const totalCustomers = mockCustomers.length;
    
    // Active inside last 30 days relative to active demo date (June 25, 2026)
    const active30Days = mockCustomers.filter(c => {
      const diffTime = Math.abs(new Date("2026-06-25T15:44:13+05:30") - new Date(c.lastOrderDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    const todayOrders = mockOrders.filter(o => o.createdAt.startsWith("2026-06-25")).length;
    const returningCustomers = mockCustomers.filter(c => c.totalOrders > 1).length;
    
    const totalRev = mockCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
    const totalOrd = mockCustomers.reduce((acc, c) => acc + c.totalOrders, 0);
    const avgOrderValue = totalOrd > 0 ? (totalRev / totalOrd) : 0;
    
    // PVP-9085 is pending refund request
    const pendingRefunds = 1;

    return {
      totalCustomers,
      active30Days,
      todayOrders,
      returningCustomers,
      avgOrderValue,
      pendingRefunds
    };
  }, []);

  // ----------------------------------------------------
  // Callbacks: Filters, Pagination, & Sorting
  // ----------------------------------------------------
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // ----------------------------------------------------
  // Interactive Dashboard Click Logic
  // ----------------------------------------------------
  const handleCardClick = (cardId) => {
    if (cardId === "returning") {
      setFilters(prev => ({
        ...prev,
        returning: !prev.returning,
        page: 1
      }));
      toast.success(filters.returning ? "Cleared Returning Filter" : "Applied Returning Customers Only");
    } else if (cardId === "refunds") {
      setFilters(prev => ({
        ...prev,
        status: prev.status === "refunded" ? "All" : "refunded",
        page: 1
      }));
      toast.success(filters.status === "refunded" ? "Cleared Refunds Filter" : "Filtered by Refunded Orders");
    }
  };

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------
  const handleActionClick = (action, payload) => {
    if (action === "viewCustomer") {
      setSelectedCustomerId(payload);
      setModalVisibility(prev => ({ ...prev, profile: true }));
    } else if (action === "viewOrders") {
      setSelectedCustomerId(payload);
      setModalVisibility(prev => ({ ...prev, orderHistory: true }));
    } else if (action === "timeline") {
      setSelectedOrderId(payload);
      setModalVisibility(prev => ({ ...prev, timeline: true }));
    } else if (action === "refundHistory") {
      setSelectedOrderId(payload);
      setModalVisibility(prev => ({ ...prev, refundHistory: true }));
    } else if (action === "downloadInvoice") {
      // Map simplified table order to full invoice order
      const orderData = mockOrders.find(o => o._id === payload._id || o.orderNumber === payload.orderNumber);
      if (orderData) {
        // Mock items list inside DownloadInvoiceModal
        const invoicePayload = {
          ...orderData,
          customer: {
            name: orderData.customerId === "cust-1" ? "Aarav Sharma" : "Customer",
            phone: "9876543210",
            email: "cust@gmail.com"
          },
          items: [
            { name: "Veg Supreme Pizza", quantity: 1, subtotal: orderData.totalAmount }
          ],
          grandTotal: orderData.totalAmount
        };
        setSelectedInvoiceOrder(invoicePayload);
        setModalVisibility(prev => ({ ...prev, invoice: true }));
      } else {
        toast.error("Invoice details not found.");
      }
    }
  };

  // Callback to view order from inside profile / history modals
  const handleInnerViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    // Close other modals and open order details
    setModalVisibility(prev => ({
      ...prev,
      profile: false,
      orderHistory: false,
      orderDetails: true
    }));
  };

  // Export handlers
  const handleExportCSV = () => {
    toast.success("Generating CSV Report...", {
      description: "Downloading customer orders breakdown sheet."
    });
  };

  const handleDownloadReports = () => {
    toast.success("Compiling PDF Analytics...", {
      description: "Customer purchasing value report ready."
    });
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Database sync completed.");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Orders
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1 font-semibold leading-normal">
            Track customer purchase history, refunds, complaints, loyalty, and order behavior.
          </p>
        </div>
        
        {/* Actions Button Grid */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-50 dark:bg-zinc-850 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-850 transition-all cursor-pointer shadow-sm"
          >
            <FileDown size={13} className="text-zinc-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadReports}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-50 dark:bg-zinc-850 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-850 transition-all cursor-pointer shadow-sm"
          >
            <Download size={13} className="text-zinc-400" />
            <span>Download Reports</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/10"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <CustomerStatsCards
        stats={stats}
        isLoading={isLoading}
        onCardClick={handleCardClick}
        activeFilters={filters}
      />

      {/* FILTER SECTION */}
      <CustomerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* CUSTOMER ORDERS TABLE */}
      <CustomerOrdersTable
        customers={data?.customers || []}
        pagination={data?.pagination || {}}
        isLoading={isLoading}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onActionClick={handleActionClick}
        userRole={role}
      />

      {/* ----------------------------------------------------
          MODALS INTEGRATION
      ---------------------------------------------------- */}
      {/* 1. Customer Profile Modal */}
      <CustomerProfileModal
        visible={modalVisibility.profile}
        onClose={() => setModalVisibility(prev => ({ ...prev, profile: false }))}
        customerId={selectedCustomerId}
        onViewOrder={handleInnerViewOrder}
      />

      {/* 2. Customer Order History Modal */}
      <CustomerOrderHistoryModal
        visible={modalVisibility.orderHistory}
        onClose={() => setModalVisibility(prev => ({ ...prev, orderHistory: false }))}
        customerId={selectedCustomerId}
        onViewOrder={handleInnerViewOrder}
        onDownloadInvoice={(ord) => handleActionClick("downloadInvoice", ord)}
        userRole={role}
      />

      {/* 3. Order Details Modal */}
      <OrderDetailsModal
        visible={modalVisibility.orderDetails}
        onClose={() => setModalVisibility(prev => ({ ...prev, orderDetails: false }))}
        orderId={selectedOrderId}
      />

      {/* 4. Refund History Modal */}
      <RefundHistoryModal
        visible={modalVisibility.refundHistory}
        onClose={() => setModalVisibility(prev => ({ ...prev, refundHistory: false }))}
        orderId={selectedOrderId}
        userRole={role}
      />

      {/* 5. Order Timeline Modal */}
      <OrderTimelineModal
        visible={modalVisibility.timeline}
        onClose={() => setModalVisibility(prev => ({ ...prev, timeline: false }))}
        orderId={selectedOrderId}
      />

      {/* 6. Invoice Download/Preview Modal (Shared Reusable component) */}
      <DownloadInvoiceModal
        visible={modalVisibility.invoice}
        onClose={() => setModalVisibility(prev => ({ ...prev, invoice: false }))}
        order={selectedInvoiceOrder}
      />
    </div>
  );
}
