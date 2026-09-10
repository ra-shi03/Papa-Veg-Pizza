import React, { useState } from "react";
import { Modal, Tabs, Table, Tag } from "antd";
import { ChefHat, BookOpen, Clock, Layers, FileCheck, Printer, HeartHandshake, ListOrdered } from "lucide-react";
import { useRecipes, useIngredients } from "../hooks/usePreparationBoard";

export default function RecipeModal({ visible, onClose, item }) {
  const { data: recipes = [], isLoading: loadingRecipes } = useRecipes();
  const { data: ingredients = [], isLoading: loadingIngredients } = useIngredients();

  if (!item) return null;

  // Find corresponding recipe
  const recipe = recipes.find((r) => r.name.toLowerCase().includes(item.name.toLowerCase()) || r._id === item.recipeId) || recipes[0];

  const handlePrint = () => {
    window.print();
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case "easy":
        return "green";
      case "medium":
        return "orange";
      default:
        return "red";
    }
  };

  // Build ingredients list mapped against live stock inventory levels
  const getIngredientTableData = () => {
    if (!recipe || !recipe.ingredients) return [];
    return recipe.ingredients.map((ring, idx) => {
      const stockItem = ingredients.find((i) => i.name.toLowerCase().includes(ring.name.toLowerCase()) || i._id === ring.ingredientId);
      return {
        key: idx,
        name: ring.name,
        qty: `${ring.quantity} ${ring.unit || "g"}`,
        stock: stockItem ? `${stockItem.currentStock} ${stockItem.unit}` : "N/A",
        status: stockItem ? stockItem.availability : "In Stock"
      };
    });
  };

  const getStockStatusTag = (status) => {
    switch (status) {
      case "In Stock":
        return <Tag color="green" className="border-0 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full">In Stock</Tag>;
      case "Low Stock":
        return <Tag color="orange" className="border-0 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full">Low Stock</Tag>;
      default:
        return <Tag color="red" className="border-0 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full">Out of Stock</Tag>;
    }
  };

  const ingredientColumns = [
    {
      title: "Ingredient",
      dataIndex: "name",
      key: "name",
      className: "text-[11px] font-black text-slate-800 dark:text-zinc-200"
    },
    {
      title: "Required",
      dataIndex: "qty",
      key: "qty",
      className: "text-[11px] font-bold text-slate-600 dark:text-zinc-400"
    },
    {
      title: "Current Stock",
      dataIndex: "stock",
      key: "stock",
      className: "text-[11px] font-bold text-slate-600 dark:text-zinc-400"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStockStatusTag(status)
    }
  ];

  const tabItems = recipe ? [
    {
      key: "basic",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <BookOpen size={14} />
          Details
        </span>
      ),
      children: (
        <div className="space-y-4 py-2 text-xs">
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850">
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full sm:w-28 h-28 object-cover rounded-xl border border-slate-200 dark:border-zinc-800 shrink-0"
            />
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{recipe.name}</h4>
                <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-550 mt-0.5">{recipe.recipeCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-slate-100 dark:border-zinc-850">
                  <span className="text-[8px] font-black text-slate-450 uppercase block">Prep Time</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-blue-500" />
                    {recipe.prepTime} mins
                  </span>
                </div>
                <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-slate-100 dark:border-zinc-850">
                  <span className="text-[8px] font-black text-slate-450 uppercase block">Complexity</span>
                  <div className="mt-0.5">
                    <Tag color={getDifficultyColor(recipe.difficulty)} className="border-0 font-extrabold uppercase text-[9px] px-2 py-0.5 rounded-full">
                      {recipe.difficulty}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "ingredients",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <Layers size={14} />
          Ingredients
        </span>
      ),
      children: (
        <div className="py-2">
          <Table
            dataSource={getIngredientTableData()}
            columns={ingredientColumns}
            pagination={false}
            size="small"
            bordered={false}
            className="compact-table"
          />
        </div>
      )
    },
    {
      key: "instructions",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <ListOrdered size={14} />
          Instructions
        </span>
      ),
      children: (
        <div className="py-2 text-xs space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
          {recipe.instructions?.map((step, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-black shrink-0">
                {idx + 1}
              </span>
              <p className="text-slate-700 dark:text-zinc-350 font-bold leading-relaxed pt-0.5">
                {step}
              </p>
            </div>
          ))}
        </div>
      )
    }
  ] : [];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <ChefHat size={18} className="text-[var(--primary)]" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Recipe Guidelines</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5">
              Production guidelines for Pizza chefs
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={500}
      centered
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--sa-secondary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={12} />
            Print Recipe
          </button>
        </div>
      }
    >
      {loadingRecipes || loadingIngredients ? (
        <div className="py-8 space-y-4">
          <Skeleton active />
        </div>
      ) : !recipe ? (
        <p className="text-center py-6 text-slate-455 text-xs font-bold">
          Recipe specifications not found.
        </p>
      ) : (
        <Tabs defaultActiveKey="basic" items={tabItems} className="recipe-tabs mt-1" />
      )}
    </Modal>
  );
}
