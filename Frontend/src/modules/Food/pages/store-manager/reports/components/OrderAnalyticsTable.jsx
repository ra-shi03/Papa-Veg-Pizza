import React from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function OrderAnalyticsTable({ data = [], pagination = {}, isLoading, onViewDetails, onViewRefund }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const handleSort = (field) => {
    const params = new URLSearchParams(searchParams);
    const isAsc = sortBy === field && sortOrder === "asc";
    params.set("sortBy", field);
    params.set("sortOrder", isAsc ? "desc" : "asc");
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
  };

  const SortHeader = ({ field, label }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-[var(--primary)] transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <ArrowUpDown size={10} className="opacity-70" />
      </div>
    </th>
  );

  const getStatusBadge = (status) => {
    const normalized = status?.toLowerCase() || "";
    if (normalized === "completed" || normalized === "delivered") {
      return (
        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
          {status}
        </span>
      );
    }
    if (normalized === "cancelled") {
      return (
        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
          Cancelled
        </span>
      );
    }
    if (normalized === "refunded") {
      return (
        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
          Refunded
        </span>
      );
    }
    return (
      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse">
        {status}
      </span>
    );
  };

  const limit = pagination.limit || 10;
  const total = pagination.total || 0;
  const pages = pagination.pages || 1;
  const startIndex = (currentPage - 1) * limit;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 transition-all">
      <div>
        <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">
          Order Analytics Register
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Daily order fulfillment logs and cooking times</p>
      </div>

      <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-850 rounded-2xl scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 border-collapse table-auto">
          <thead className="bg-zinc-50/70 dark:bg-zinc-950/30 sticky top-0">
            <tr>
              <SortHeader field="orderNumber" label="Order ID" />
              <SortHeader field="customerName" label="Customer" />
              <SortHeader field="orderType" label="Type" />
              <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Items</th>
              <SortHeader field="totalAmount" label="Amount" />
              <SortHeader field="preparationTime" label="Prep Time" />
              <SortHeader field="deliveryTime" label="Del. Time" />
              <SortHeader field="orderStatus" label="Status" />
              <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Coupon</th>
              <SortHeader field="createdAt" label="Created Date" />
              <th className="px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-850 dark:text-zinc-205">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {Array.from({ length: 11 }).map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((order) => (
                <tr key={order._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap text-zinc-900 dark:text-white">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-[10px] font-black uppercase text-zinc-500">
                    {order.orderType}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                    {order.itemsCount} pcs
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                    {formatINR(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                    {order.preparationTime} mins
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                    {order.orderType === "delivery" ? `${order.deliveryTime} mins` : "--"}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getStatusBadge(order.orderStatus)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {order.couponCode ? (
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/30">
                        {order.couponCode}
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewDetails(order._id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer shadow-sm text-[11px]"
                    >
                      <Eye size={12} className="text-[var(--primary)]" />
                      <span>Details</span>
                    </button>

                    {order.orderStatus === "refunded" && (
                      <button
                        onClick={() => onViewRefund(order._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-900/30 rounded-xl transition-all cursor-pointer shadow-sm text-[11px]"
                      >
                        <ShieldAlert size={12} />
                        <span>Refund</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 font-bold">
                  No order logs found matching criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
            Showing {startIndex + 1} - {Math.min(startIndex + limit, total)} of {total} orders
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-black text-zinc-800 dark:text-white px-2">
              Page {currentPage} of {pages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, pages))}
              disabled={currentPage === pages}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
