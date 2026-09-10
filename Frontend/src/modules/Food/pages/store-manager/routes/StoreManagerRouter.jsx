import { Suspense, useEffect } from "react"
import { Routes, Route, Navigate, useLocation, useOutletContext } from "react-router-dom"
import { useSystemTheme } from "@/shared/utils/themeSync"
import ProtectedRoute from "@food/components/ProtectedRoute"
import * as Icons from "lucide-react"
import StoreOperationsLayout from "../layouts/StoreOperationsLayout"
import Loader from "@food/components/Loader"
import StoreOperationsDashboard from "../dashboard/StoreOperationsDashboard"
import IncomingOrders from "../orders/IncomingOrders"
import ActiveOrders from "../orders/ActiveOrders"
import ReadyOrders from "../orders/ReadyOrders"
import CompletedOrders from "../orders/CompletedOrders"
import CancelledOrders from "../orders/CancelledOrders"
import KitchenQueue from "../kitchenOperations/KitchenQueue"
import PreparationBoard from "../kitchenOperations/PreparationBoard"
import PizzaStation from "../kitchenOperations/PizzaStation"
import BakingStation from "../kitchenOperations/BakingStation"
import PackagingStation from "../kitchenOperations/PackagingStation"
import DelayedOrders from "../kitchenOperations/DelayedOrders"
import AssignRider from "../deliveryOperations/AssignRider"
import RiderAvailability from "../deliveryOperations/RiderAvailability"
import DeliveryTracking from "../deliveryOperations/DeliveryTracking"
import DeliveryIssue from "../deliveryOperations/DeliveryIssue"
import IngredientStock from "../inventory/IngredientStock"
import StockRequests from "../inventory/StockRequests"
import WasteManagement from "../inventory/WasteManagement"
import LowStockAlerts from "../inventory/LowStockAlerts"
import IngredientShortages from "../inventory/IngredientShortages"
import KitchenStaff from "../staffManagement/KitchenStaff"
import Attendance from "../staffManagement/Attendance"
import ShiftManagement from "../staffManagement/ShiftManagement"
import Performance from "../staffManagement/Performance"
import CustomerOrders from "../customers/CustomerOrders"
import Complaints from "../customers/Complaints"
import Reviews from "../customers/Reviews"
import DailySales from "../reports/DailySales"
import OrderReports from "../reports/OrderReports"
import KitchenPerformance from "../reports/KitchenPerformance"
import StaffPerformance from "../reports/StaffPerformance"
import StorePerformance from "../reports/StorePerformance"
import Profile from "../profile/Profile"
import MyTasks from "../myTasks/MyTasks"






// A role-based routing wrapper that prevents unauthorized roles from viewing pages
function RoleProtectedRoute({ allowedRoles, children }) {
  const { role } = useOutletContext()

  if (!allowedRoles.includes(role)) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-16 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-xl text-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icons.ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
          Your current role <strong className="text-rose-500">({role})</strong> does not have permission to access this page. Please switch your role using the demo toggle in the top navbar.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-2xl text-xs transition-all"
        >
          Go Back
        </button>
      </div>
    )
  }

  return children
}

// A beautiful, highly aesthetic placeholder view for each page matching the Papa Veg styling
function PagePlaceholder({ title, description, allowedRoles }) {
  const { role } = useOutletContext()

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            Active Module
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            Role: {role}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm min-h-[420px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
          <Icons.Pizza size={32} />
        </div>
        <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">{title} Dashboard</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
          Welcome to the {title} operational view. This console is fully simulated for testing permissions and layout changes.
        </p>

        {/* Permission matrix preview */}
        <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-850 px-4 py-2 rounded-full border border-zinc-100 dark:border-zinc-800">
          Allowed Roles: {allowedRoles.join(", ")}
        </div>
      </div>
    </div>
  )
}

export default function StoreManagerRouter() {
  const location = useLocation()

  // Make sure theme and styles are applied properly
  useSystemTheme()

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Redirect old login path to unified store login */}
        <Route path="login" element={<Navigate to="/store-operation/login" replace />} />

        <Route
          element={
            <ProtectedRoute module="admin" requiredRole={["store-manager", "kitchen-supervisor", "kitchen-staff"]} loginPath="/store-operation/login">
              <StoreOperationsLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Path Redirect */}
          <Route path="/" element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<StoreOperationsDashboard />} />

          {/* Orders */}
          <Route
            path="orders/incoming"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor"]}>
                <IncomingOrders />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="orders/active"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff", "packaging_staff"]}>
                <ActiveOrders />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="orders/ready"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "delivery_coordinator", "kitchen_staff", "packaging_staff"]}>
                <ReadyOrders />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="orders/completed"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor"]}>
                <CompletedOrders />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="orders/cancelled"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor"]}>
                <CancelledOrders />
              </RoleProtectedRoute>
            }
          />

          {/* Kitchen Operations */}
          <Route
            path="kitchen/queue"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <KitchenQueue />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="kitchen/preparation"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <PreparationBoard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="kitchen/pizza-station"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <PizzaStation />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="kitchen/baking-station"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <BakingStation />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="kitchen/packaging-station"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <PackagingStation />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="kitchen/delayed-orders"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor"]}>
                <DelayedOrders />
              </RoleProtectedRoute>
            }
          />

          {/* Delivery Operations */}
          <Route
            path="delivery/assign"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <AssignRider />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="delivery/availability"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <RiderAvailability />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="delivery/tracking"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <DeliveryTracking />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="delivery/issues"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <DeliveryIssue />
              </RoleProtectedRoute>
            }
          />

          {/* Inventory */}
          <Route
            path="inventory/stock"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <IngredientStock />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="inventory/requests"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <StockRequests />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="inventory/waste"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <WasteManagement />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="inventory/low-stock"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor"]}>
                <LowStockAlerts />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="inventory/shortages"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <IngredientShortages />
              </RoleProtectedRoute>
            }
          />

          {/* Staff Management */}
          <Route
            path="staff/list"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <KitchenStaff />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="staff/attendance"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor"]}>
                <Attendance />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="staff/shifts"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <ShiftManagement />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="staff/performance"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor"]}>
                <Performance />
              </RoleProtectedRoute>
            }
          />

          {/* Customers */}
          <Route
            path="customers/orders"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "assistant_manager", "store_owner"]}>
                <CustomerOrders />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="customers/complaints"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "assistant_manager", "store_owner"]}>
                <Complaints />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="customers/reviews"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "store_owner", "assistant_manager", "customer_experience_manager"]}>
                <Reviews />
              </RoleProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="reports/sales"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <DailySales />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="reports/orders"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <OrderReports />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="reports/kitchen"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <KitchenPerformance />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="reports/staff"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <StaffPerformance />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="reports/store"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager"]}>
                <StorePerformance />
              </RoleProtectedRoute>
            }
          />

          {/* My Tasks */}
          <Route
            path="tasks"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <MyTasks />
              </RoleProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="profile"
            element={
              <RoleProtectedRoute allowedRoles={["store_manager", "kitchen_supervisor", "kitchen_staff"]}>
                <Profile />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="profile/supervisor"
            element={
              <Profile forcedRole="kitchen_supervisor" />
            }
          />
          <Route
            path="profile/staff"
            element={
              <Profile forcedRole="kitchen_staff" />
            }
          />

          {/* Unknown routes redirect to dashboard */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
