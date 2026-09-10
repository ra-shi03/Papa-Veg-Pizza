import React, { useState, useEffect } from "react";
import { Modal, Select, Button, Form, Badge, Avatar } from "antd";
import { UserCheck, ChefHat, Package, Flame } from "lucide-react";
import { useActiveKitchenStaff, useAssignStaff } from "../hooks/useActiveOrders";

export default function AssignStaffModal({ visible, onClose, order }) {
  const [pizzaChefId, setPizzaChefId] = useState(null);
  const [bakingChefId, setBakingChefId] = useState(null);
  const [packagingStaffId, setPackagingStaffId] = useState(null);

  const { data: pizzaChefs = [], isLoading: loadingPizza } = useActiveKitchenStaff("pizza_chef");
  const { data: bakingChefs = [], isLoading: loadingBaking } = useActiveKitchenStaff("baking_chef");
  const { data: packagingStaff = [], isLoading: loadingPackaging } = useActiveKitchenStaff("packaging_staff");

  const assignStaffMutation = useAssignStaff();

  // Populate currently assigned staff when modal opens
  useEffect(() => {
    if (order && order.assignedStaff) {
      setPizzaChefId(order.assignedStaff.pizza_chef?._id || null);
      setBakingChefId(order.assignedStaff.baking_chef?._id || null);
      setPackagingStaffId(order.assignedStaff.packaging_staff?._id || null);
    } else {
      setPizzaChefId(null);
      setBakingChefId(null);
      setPackagingStaffId(null);
    }
  }, [order, visible]);

  if (!order) return null;

  const getWorkloadStatus = (count) => {
    if (count <= 1) return { label: "Low Load", color: "green", bg: "bg-green-50 text-green-700 border-green-200" };
    if (count <= 3) return { label: "Medium Load", color: "orange", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "High Load", color: "red", bg: "bg-red-50 text-red-700 border-red-200" };
  };

  const handleSave = async () => {
    try {
      const currentPizza = order.assignedStaff?.pizza_chef?._id || null;
      const currentBaking = order.assignedStaff?.baking_chef?._id || null;
      const currentPackaging = order.assignedStaff?.packaging_staff?._id || null;

      // Assign Pizza Chef if changed
      if (pizzaChefId !== currentPizza) {
        await assignStaffMutation.mutateAsync({
          orderId: order._id,
          role: "pizza_chef",
          staffId: pizzaChefId
        });
      }

      // Assign Baking Chef if changed
      if (bakingChefId !== currentBaking) {
        await assignStaffMutation.mutateAsync({
          orderId: order._id,
          role: "baking_chef",
          staffId: bakingChefId
        });
      }

      // Assign Packaging Staff if changed
      if (packagingStaffId !== currentPackaging) {
        await assignStaffMutation.mutateAsync({
          orderId: order._id,
          role: "packaging_staff",
          staffId: packagingStaffId
        });
      }

      onClose();
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  const renderStaffOption = (staff) => {
    const workload = getWorkloadStatus(staff.currentActiveOrders || 0);
    return (
      <Select.Option key={staff._id} value={staff._id}>
        <div className="flex items-center justify-between w-full py-1">
          <div className="flex items-center gap-2">
            <Avatar size="small" src={staff.avatar} className="border border-zinc-200">
              {staff.name.charAt(0)}
            </Avatar>
            <span className="font-semibold text-slate-800 dark:text-zinc-200 text-xs">{staff.name}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${workload.bg}`}>
            {workload.label} ({staff.currentActiveOrders || 0} active)
          </span>
        </div>
      </Select.Option>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <UserCheck size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Assign Kitchen Staff</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Allocate specialized chefs to Order {order.orderNumber}</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={480}
      centered
      destroyOnClose
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={assignStaffMutation.isPending}
          onClick={handleSave}
          className="!bg-primary hover:!bg-primary-hover text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          Save Assignments
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        {/* Pizza Chef Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <ChefHat size={14} className="text-blue-500" />
            Pizza Chef (Preparing Stage)
          </label>
          <Select
            placeholder="Select Pizza Chef"
            value={pizzaChefId}
            onChange={(val) => setPizzaChefId(val)}
            className="w-full h-10 rounded-xl"
            loading={loadingPizza}
            allowClear
            dropdownMatchSelectWidth={false}
          >
            {pizzaChefs.map(renderStaffOption)}
          </Select>
        </div>

        {/* Baking Chef Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Flame size={14} className="text-amber-500" />
            Baking Chef (Baking Stage)
          </label>
          <Select
            placeholder="Select Baking Chef"
            value={bakingChefId}
            onChange={(val) => setBakingChefId(val)}
            className="w-full h-10 rounded-xl"
            loading={loadingBaking}
            allowClear
            dropdownMatchSelectWidth={false}
          >
            {bakingChefs.map(renderStaffOption)}
          </Select>
        </div>

        {/* Packaging Staff Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Package size={14} className="text-purple-500" />
            Packaging Staff (Packaging Stage)
          </label>
          <Select
            placeholder="Select Packaging Staff"
            value={packagingStaffId}
            onChange={(val) => setPackagingStaffId(val)}
            className="w-full h-10 rounded-xl"
            loading={loadingPackaging}
            allowClear
            dropdownMatchSelectWidth={false}
          >
            {packagingStaff.map(renderStaffOption)}
          </Select>
        </div>
      </div>
    </Modal>
  );
}
