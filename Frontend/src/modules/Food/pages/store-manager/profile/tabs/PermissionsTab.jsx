import React, { useState, useEffect } from "react";
import { Shield, Info } from "lucide-react";
import { profileApi } from "@food/api";
import PermissionRow from "../components/PermissionRow";

export default function PermissionsTab() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const res = await profileApi.getPermissions();
        if (res.success) {
          setPermissions(res.data);
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const permissionDefinitions = [
    { key: "Dashboard", name: "Operations Dashboard", description: "View main store metrics, sales stats, and active alerts" },
    { key: "IncomingOrders", name: "Accept Incoming Orders", description: "Accept, reject, and route newly placed orders" },
    { key: "ActiveOrders", name: "Manage Active Orders", description: "Track orders through prepare, bake, pack, and handoff" },
    { key: "KitchenQueue", name: "Kitchen Operations Queue", description: "Monitor the master kitchen queue and itemized logs" },
    { key: "PizzaStation", name: "Pizza station console", description: "Prepare crusts, sauces, and apply toppings" },
    { key: "BakingStation", name: "Oven & baking console", description: "Slide pizzas into deck ovens and monitor baking timers" },
    { key: "PackagingStation", name: "Packaging & Quality station", description: "Check order accuracy, slice, box, and attach labels" },
    { key: "DeliveryOperations", name: "Rider dispatch console", description: "Assign riders, track dispatch times, and resolve delivery disputes" },
    { key: "Inventory", name: "Inventory Stock Control", description: "Audit cheese, dough, vegetables, and packaging inventory" },
    { key: "StockRequests", name: "Stock refill requests", description: "Initiate purchase orders and franchise restock requests" },
    { key: "WasteManagement", name: "Waste & Spoilage logger", description: "Report spoiled items, dropped bases, or incorrect prep items" },
    { key: "StaffManagement", name: "Staff attendance & shifts", description: "Organize shifts, check attendance logs, and approve leaves" },
    { key: "Reports", name: "Performance & revenue reports", description: "View daily sales, waste volumes, and hourly preparation speeds" },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
        <Shield size={16} className="text-[var(--primary)]" />
        <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
          Functional Access Rights
        </h2>
      </div>

      {/* INFORMATION ALERTS */}
      <div className="mb-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 flex items-start gap-2.5">
        <Info size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
            Read-Only Authorization Matrix
          </p>
          <p className="text-[9px] font-medium text-slate-450 dark:text-zinc-500 leading-normal">
            Your permissions are determined by your assigned store role (Store Manager, Kitchen Supervisor, or Kitchen Staff). If you require access to locked features, please submit a request to your Franchise Admin.
          </p>
        </div>
      </div>

      {/* PERMISSION TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              <th className="py-2 px-3 text-left">Functional Module</th>
              <th className="py-2 px-3 text-right">Authorized Status</th>
            </tr>
          </thead>
          <tbody>
            {permissionDefinitions.map((permission) => (
              <PermissionRow
                key={permission.key}
                name={permission.name}
                description={permission.description}
                allowed={!!permissions?.[permission.key]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
