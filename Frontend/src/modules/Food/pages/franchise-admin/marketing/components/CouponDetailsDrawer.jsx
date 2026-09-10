import React, { useMemo } from "react";
import { Drawer, Tag, Table, Skeleton } from "antd";
import { 
  Ticket, Calendar, User, Info, Store, Pizza, FolderOpen, 
  TrendingUp, BarChart3, Users, DollarSign, RefreshCw 
} from "lucide-react";
import { mockStores, mockProducts, mockCategories } from "../mockData";

export default function CouponDetailsDrawer({ visible, onClose, coupon, getCouponUsageDetails }) {
  const details = useMemo(() => {
    if (!coupon) return null;
    return getCouponUsageDetails(coupon._id);
  }, [coupon, getCouponUsageDetails]);

  // Resolve store names
  const storeNames = useMemo(() => {
    if (!coupon || !coupon.storeIds || coupon.storeIds.length === 0) return ["All Stores"];
    return coupon.storeIds.map(sid => {
      const match = mockStores.find(s => s._id === sid);
      return match ? match.name : sid;
    });
  }, [coupon]);

  // Resolve product names
  const productNames = useMemo(() => {
    if (!coupon || !coupon.applicableProducts || coupon.applicableProducts.length === 0) return ["All Products"];
    return coupon.applicableProducts.map(pid => {
      const match = mockProducts.find(p => p._id === pid);
      return match ? match.name : pid;
    });
  }, [coupon]);

  // Resolve category names
  const categoryNames = useMemo(() => {
    if (!coupon || !coupon.applicableCategories || coupon.applicableCategories.length === 0) return ["All Categories"];
    return coupon.applicableCategories.map(cid => {
      const match = mockCategories.find(c => c._id === cid);
      return match ? match.name : cid;
    });
  }, [coupon]);

  if (!coupon) return null;

  const getDiscountBadgeColor = (type) => {
    switch (type) {
      case "percentage": return "blue";
      case "fixed": return "green";
      case "free-delivery": return "purple";
      default: return "default";
    }
  };

  const getDiscountTypeText = (type) => {
    switch (type) {
      case "percentage": return "Percentage Discount";
      case "fixed": return "Fixed Amount Discount";
      case "free-delivery": return "Free Delivery Discount";
      default: return type;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const topCustomersColumns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      className: "font-bold text-zinc-700 dark:text-zinc-350 text-[10px]"
    },
    {
      title: "Orders",
      dataIndex: "ordersCount",
      key: "ordersCount",
      align: "center",
      render: val => <span className="font-bold text-zinc-800 dark:text-zinc-150">{val}</span>
    },
    {
      title: "Total Savings",
      dataIndex: "totalSavings",
      key: "totalSavings",
      align: "right",
      render: val => <span className="font-bold text-emerald-600">{formatCurrency(val)}</span>
    },
    {
      title: "Last Used",
      dataIndex: "lastUsed",
      key: "lastUsed",
      render: val => <span>{new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
    }
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <Ticket className="text-[var(--primary)] shrink-0" size={16} />
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
              Coupon Details
            </span>
            <span className="text-[9px] text-zinc-400 font-semibold mt-0.5 leading-none">
              Code: {coupon.couponCode}
            </span>
          </div>
        </div>
      }
      placement="right"
      size={600}
      onClose={onClose}
      open={visible}
      className="font-['Poppins'] dark:bg-zinc-950"
      styles={{ body: { padding: "16px", backgroundColor: "#f8fafc" } }}
    >
      <div className="space-y-4">
        {/* Section 1: Coupon Information */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-3">
            <h4 className="font-black text-[10px] text-zinc-800 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={13} className="text-[var(--primary)]" />
              Coupon Information
            </h4>
            <Tag color={coupon.status === "active" ? "green" : coupon.status === "expired" ? "red" : "default"} className="font-bold text-[9px] uppercase border-0 px-2 py-0.2 rounded m-0">
              {coupon.status}
            </Tag>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-zinc-400 uppercase text-[9px] flex items-center">Coupon Code:</span>
              <span className="col-span-2 font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono w-fit text-[10px]">
                {coupon.couponCode}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Title:</span>
              <span className="col-span-2 font-bold text-slate-800 dark:text-zinc-200">{coupon.title}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Description:</span>
              <span className="col-span-2 text-zinc-600 dark:text-zinc-400 font-semibold leading-normal">{coupon.description}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Discount:</span>
              <span className="col-span-2">
                <Tag color={getDiscountBadgeColor(coupon.discountType)} className="font-extrabold text-[9px] uppercase border-0 px-2 py-0.2 rounded m-0">
                  {getDiscountTypeText(coupon.discountType)}: {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : coupon.discountType === "free-delivery" ? "Free Delivery" : formatCurrency(coupon.discountValue)}
                </Tag>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-zinc-400 uppercase text-[9px] flex items-center">Validity:</span>
              <span className="col-span-2 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Calendar size={12} className="text-zinc-400" />
                {new Date(coupon.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} to {new Date(coupon.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-dashed border-zinc-100 dark:border-zinc-800 pt-2 mt-2">
              <span className="font-bold text-zinc-400 uppercase text-[9px] flex items-center">Created By:</span>
              <span className="col-span-2 font-semibold text-zinc-650 dark:text-zinc-350 flex items-center gap-1">
                <User size={12} className="text-zinc-400" />
                {coupon.createdBy}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Created At:</span>
              <span className="col-span-2 text-zinc-550 dark:text-zinc-400 font-medium">
                {new Date(coupon.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Applicable Stores */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <h4 className="font-black text-[10px] text-zinc-800 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-3">
            <Store size={13} className="text-[var(--primary)]" />
            Applicable Stores
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {storeNames.map((store, idx) => (
              <Tag key={idx} color="orange" className="font-bold text-[9px] uppercase border-0 px-2 py-0.5 rounded m-0">
                {store}
              </Tag>
            ))}
          </div>
        </div>

        {/* Section 3: Applicable Products */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <h4 className="font-black text-[10px] text-zinc-800 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-3">
            <Pizza size={13} className="text-[var(--primary)]" />
            Applicable Products
          </h4>
          <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5 pr-1 scrollbar-thin">
            {productNames.map((prod, idx) => (
              <Tag key={idx} color="cyan" className="font-bold text-[9px] uppercase border-0 px-2 py-0.5 rounded m-0">
                {prod}
              </Tag>
            ))}
          </div>
        </div>

        {/* Section 4: Categories */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <h4 className="font-black text-[10px] text-zinc-800 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-3">
            <FolderOpen size={13} className="text-[var(--primary)]" />
            Applicable Categories
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {categoryNames.map((cat, idx) => (
              <Tag key={idx} color="purple" className="font-bold text-[9px] uppercase border-0 px-2 py-0.5 rounded m-0">
                {cat}
              </Tag>
            ))}
          </div>
        </div>

        {/* Section 5: Usage Statistics */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <h4 className="font-black text-[10px] text-zinc-800 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-3">
            <TrendingUp size={13} className="text-[var(--primary)]" />
            Usage Statistics
          </h4>

          {!details ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Stat 1: Total Usage */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg flex flex-col justify-between">
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  <BarChart3 size={10} />
                  Total Usage
                </span>
                <span className="text-base font-black text-slate-800 dark:text-white mt-1.5">
                  {details.analytics.totalUsage} Times
                </span>
              </div>

              {/* Stat 2: Total Discount */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg flex flex-col justify-between">
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  <DollarSign size={10} />
                  Discount Given
                </span>
                <span className="text-base font-black text-rose-600 mt-1.5">
                  {formatCurrency(details.analytics.totalDiscountGiven)}
                </span>
              </div>

              {/* Stat 3: Revenue Generated */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg flex flex-col justify-between">
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  <DollarSign size={10} />
                  Revenue Gen
                </span>
                <span className="text-base font-black text-emerald-600 mt-1.5">
                  {formatCurrency(details.analytics.revenueGenerated)}
                </span>
              </div>

              {/* Stat 4: AOV */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg flex flex-col justify-between col-span-1">
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider">
                  Avg Order Value
                </span>
                <span className="text-base font-black text-blue-600 mt-1.5">
                  {formatCurrency(details.analytics.averageOrderValue)}
                </span>
              </div>

              {/* Stat 5: Conversion */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg flex flex-col justify-between col-span-1">
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider">
                  Conversion Rate
                </span>
                <span className="text-base font-black text-purple-600 mt-1.5">
                  {details.analytics.conversionRate}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Top Customers Using Coupon */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <h4 className="font-black text-[10px] text-zinc-800 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-3">
            <Users size={13} className="text-[var(--primary)]" />
            Top Customers Using Coupon
          </h4>
          
          {!details ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : details.topCustomers.length === 0 ? (
            <div className="text-center py-4 text-zinc-400 font-semibold text-[10px] uppercase">
              No usage history available for this coupon yet.
            </div>
          ) : (
            <Table
              columns={topCustomersColumns}
              dataSource={details.topCustomers}
              rowKey="customerId"
              pagination={false}
              size="small"
              bordered
              className="text-[10px]"
            />
          )}
        </div>
      </div>
    </Drawer>
  );
}
