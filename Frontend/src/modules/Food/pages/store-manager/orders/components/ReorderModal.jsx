import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, List, Tooltip } from "antd";
import { ClipboardCopy, Trash2, Plus, Minus, AlertTriangle } from "lucide-react";
import { useReorderOrder } from "../hooks/useCompletedOrders";
import { toast } from "sonner";

export default function ReorderModal({ visible, onClose, order }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const reorderMutation = useReorderOrder();

  useEffect(() => {
    if (order && order.items) {
      // Map original items to edit quantities
      setItems(
        order.items.map((it) => ({
          ...it,
          quantity: it.quantity || 1
        }))
      );
    }
  }, [order, visible]);

  if (!order) return null;

  const updateQuantity = (productId, delta) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          const newQty = Math.max(1, it.quantity + delta);
          return { ...it, quantity: newQty };
        }
        return it;
      })
    );
  };

  const removeItem = (productId) => {
    if (items.length <= 1) {
      toast.warning("Cannot remove all items. Order must have at least one product.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const handleCreateReorder = async () => {
    try {
      const res = await reorderMutation.mutateAsync({
        previousOrderId: order._id,
        items
      });
      
      onClose();
      // Redirect to incoming orders page to see the newly simulated reorder
      navigate("/store-operations/orders/incoming");
    } catch (e) {
      // Handled by mutation toast
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <ClipboardCopy size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Create Order Reorder</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Clone items from Order {order.orderNumber} to draft a new order</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={500}
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
          loading={reorderMutation.isPending}
          onClick={handleCreateReorder}
          className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          Create Order
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        
        {/* Helper Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-2xl flex gap-2.5 items-start">
          <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
          <div className="text-xs">
            <p className="font-bold text-amber-800 dark:text-amber-400">Order Cloning Preview</p>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-500 font-semibold mt-0.5">
              Confirm item quantities before generating the draft. The new order will post to the Incoming console for review.
            </p>
          </div>
        </div>

        {/* Product Items List */}
        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div 
              key={item.productId}
              className="bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-3 rounded-2xl flex items-center justify-between text-xs font-bold"
            >
              <div className="flex items-center gap-2.5">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800" />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <ClipboardCopy size={16} />
                  </div>
                )}
                <div>
                  <h4 className="text-slate-805 dark:text-zinc-200 font-extrabold max-w-[180px] truncate">{item.name}</h4>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">{item.size || "Standard"} | {item.variant || "Original"}</p>
                </div>
              </div>

              {/* Quantity Controls and Delete */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-1.5 py-0.5 shadow-sm">
                  <button 
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 transition-colors"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="px-2 text-slate-800 dark:text-zinc-200 text-xs font-black min-w-[16px] text-center">
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 transition-colors"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <Tooltip title="Remove item from reorder">
                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all active:scale-95"
                  >
                    <Trash2 size={13} />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Cart Summary */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center text-xs font-black text-slate-900 dark:text-white px-1">
          <span>Est. Draft Subtotal:</span>
          <span className="text-primary text-sm">{formatCurrency(calculateSubtotal())}</span>
        </div>

      </div>
    </Modal>
  );
}
