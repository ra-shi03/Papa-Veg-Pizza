import React from "react";
import { Modal, Tabs, Tag, Table } from "antd";
import { ChefHat, BookOpen, Layers, ListOrdered, Clock, Printer } from "lucide-react";
import { useRecipes, useIngredients } from "../hooks/usePreparationBoard";

export default function PizzaRecipeModal({ visible, onClose, item }) {
  const { data: recipes = [] } = useRecipes();
  const { data: ingredients = [] } = useIngredients();

  if (!item) return null;

  // Find corresponding recipe
  const recipe = recipes.find((r) => r.name.toLowerCase().includes(item.name.toLowerCase()) || r._id === item.recipeId) || recipes[0];

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

  // Section specifications helper
  const sections = recipe ? {
    dough: {
      title: "Dough",
      notes: "Stretch fresh dough to 10-inch diameter. Thickness must be uniform, with 1/2-inch border.",
      ingredients: recipe.ingredients?.filter((i) => i.name.toLowerCase().includes("dough")) || []
    },
    sauce: {
      title: "Sauce",
      notes: "Apply signature pizza sauce in spiral motion starting from center. Leave the border dry.",
      ingredients: recipe.ingredients?.filter((i) => i.name.toLowerCase().includes("sauce")) || []
    },
    cheese: {
      title: "Cheese",
      notes: "Scatter premium mozzarella cheese uniformly. No cheese on the dry crust border.",
      ingredients: recipe.ingredients?.filter((i) => i.name.toLowerCase().includes("cheese")) || []
    },
    veggies: {
      title: "Veggies / Toppings",
      notes: "Spread toppings evenly so every slice gets a balanced bite. Cut veggies in thin slices.",
      ingredients: recipe.ingredients?.filter((i) => 
        !i.name.toLowerCase().includes("dough") && 
        !i.name.toLowerCase().includes("sauce") && 
        !i.name.toLowerCase().includes("cheese")
      ) || []
    },
    seasoning: {
      title: "Seasoning",
      notes: "Dust crust borders with garlic powder. Sprinkle oregano-chili flakes seasoning after toppings assembly.",
      ingredients: []
    }
  } : null;

  const getIngredientStock = (name) => {
    const stockItem = ingredients.find((i) => i.name.toLowerCase().includes(name.toLowerCase()));
    return stockItem ? `${stockItem.currentStock} ${stockItem.unit}` : "In Stock";
  };

  const getIngredientStockStatus = (name) => {
    const stockItem = ingredients.find((i) => i.name.toLowerCase().includes(name.toLowerCase()));
    return stockItem ? stockItem.availability : "In Stock";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20";
      case "Low Stock":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20";
      default:
        return "text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20";
    }
  };

  const tabItems = recipe ? [
    {
      key: "ingredients",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <Layers size={14} />
          Base Ingredients
        </span>
      ),
      children: (
        <div className="space-y-4 py-2 text-xs max-h-[300px] overflow-y-auto pr-1">
          {Object.keys(sections).map((key) => {
            const sec = sections[key];
            return (
              <div key={key} className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-zinc-800 pb-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">{sec.title}</h4>
                  <span className="text-[9px] font-bold text-slate-450 dark:text-zinc-500">assembly guidelines</span>
                </div>
                
                {sec.ingredients.length > 0 ? (
                  <div className="space-y-1.5">
                    {sec.ingredients.map((ing, idx) => {
                      const stock = getIngredientStock(ing.name);
                      const status = getIngredientStockStatus(ing.name);
                      return (
                        <div key={idx} className="flex justify-between items-center font-bold text-[10px] text-slate-700 dark:text-zinc-350 bg-white dark:bg-zinc-950 p-2 rounded-xl border border-slate-100 dark:border-zinc-850">
                          <span>{ing.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 dark:text-zinc-400">Qty: {ing.quantity} {ing.unit}</span>
                            <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${getStatusColor(status)}`}>
                              {stock} ({status})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 italic">No specific stock ingredients required.</p>
                )}

                <div className="bg-slate-200/40 dark:bg-zinc-850/50 p-2 rounded-xl text-[10px] text-slate-650 dark:text-zinc-450 font-bold leading-relaxed">
                  <span className="text-slate-800 dark:text-zinc-300">Method:</span> {sec.notes}
                </div>
              </div>
            );
          })}
        </div>
      )
    },
    {
      key: "step-by-step",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-black">
          <ListOrdered size={14} />
          Step-by-Step Prep
        </span>
      ),
      children: (
        <div className="py-2 text-xs space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {/* Pizza Recipe Metadata */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 mb-2">
            <span className="font-extrabold text-slate-500 dark:text-zinc-450">Estimated Time: <strong className="text-[var(--primary)]">{recipe.prepTime} mins</strong></span>
            <span className="font-extrabold text-slate-500 dark:text-zinc-450">Difficulty: 
              <Tag color={getDifficultyColor(recipe.difficulty)} className="border-0 font-extrabold uppercase text-[9px] px-2 py-0.5 rounded-full ml-1.5">
                {recipe.difficulty}
              </Tag>
            </span>
          </div>

          <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-3 pl-6 space-y-5 py-2">
            {recipe.instructions?.map((step, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white dark:ring-zinc-950 bg-[var(--primary)] text-white text-[9px] font-black">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Step {idx + 1}: {idx === 0 ? "Dough Preparation" : idx === 1 ? "Apply Sauce" : idx === 2 ? "Add Cheese" : idx === 3 ? "Add Vegetables" : "Seasoning"}
                  </h4>
                  <p className="text-[10px] text-slate-650 dark:text-zinc-400 mt-1 leading-relaxed font-bold">
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
            <h3 className="text-base font-black text-slate-900 dark:text-white">Pizza Assembly Recipe</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5">
              Production guidelines for assembly line chefs
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={550}
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
            onClick={() => window.print()}
            className="px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--sa-secondary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={12} />
            Print Recipe
          </button>
        </div>
      }
    >
      {recipe ? (
        <Tabs defaultActiveKey="ingredients" items={tabItems} className="recipe-tabs mt-1" />
      ) : (
        <p className="text-center py-6 text-slate-450 text-xs font-bold">Recipe details unavailable.</p>
      )}
    </Modal>
  );
}
