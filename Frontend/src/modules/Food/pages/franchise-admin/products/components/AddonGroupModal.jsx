import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X, Boxes, Search, Check, AlertCircle } from "lucide-react";
import { addonGroupSchema } from "../addonGroupSchema";
import { addonService } from "../addonService";

export default function AddonGroupModal({ isOpen, onClose, onSubmit }) {
  const [localSearch, setLocalSearch] = useState("");
  
  const { data: addonsResponse } = useQuery({
    queryKey: ["addons-for-groups"],
    queryFn: () => addonService.getAddons({ limit: 100 }),
    enabled: isOpen
  });
  const allAddonsList = addonsResponse?.addons || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(addonGroupSchema),
    defaultValues: {
      name: "",
      selectionType: "SINGLE",
      minSelection: 0,
      maxSelection: 1,
      isRequired: false,
      addonIds: []
    }
  });

  const watchedName = watch("name") || "Custom Cheese Options";
  const watchedSelectionType = watch("selectionType");
  const watchedMinSelection = watch("minSelection");
  const watchedMaxSelection = watch("maxSelection");
  const watchedRequired = watch("isRequired");
  const watchedAddonIds = watch("addonIds") || [];

  // Reset fields when open
  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        selectionType: "SINGLE",
        minSelection: 0,
        maxSelection: 1,
        isRequired: false,
        addonIds: []
      });
      setLocalSearch("");
    }
  }, [isOpen, reset]);

  // Handle selection type change (defaults min/max accordingly)
  const handleSelectionTypeChange = (type, onChange) => {
    onChange(type);
    if (type === "SINGLE") {
      setValue("minSelection", 0);
      setValue("maxSelection", 1);
    } else {
      setValue("minSelection", 0);
      setValue("maxSelection", 3);
    }
  };

  const handleToggleAddon = (addonId) => {
    const isSelected = watchedAddonIds.includes(addonId);
    if (isSelected) {
      setValue(
        "addonIds",
        watchedAddonIds.filter((id) => id !== addonId)
      );
    } else {
      setValue("addonIds", [...watchedAddonIds, addonId]);
    }
  };

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  // Filter addons list locally for search in table
  const filteredAddons = allAddonsList.filter((a) =>
    a.name.toLowerCase().includes(localSearch.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[850px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-600 text-white rounded-lg"><Boxes size={14} /></span>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                Create Add-on Customization Group
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={15} />
            </button>
          </header>

          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 max-h-[75vh] scrollbar-thin">
              
              {/* Form Inputs (Left side) */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Basic Group Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-zinc-450 font-black uppercase tracking-wider">Group Specifications</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-bold">Group Name *</label>
                    <input
                      type="text"
                      {...register("name")}
                      className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                      placeholder="e.g. Choose Cheese Options"
                    />
                    {errors.name && <p className="text-[10px] text-red-650 font-bold">{errors.name.message}</p>}
                  </div>

                  {/* Selection Type Radio Cards */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-500 font-bold">Selection Type</label>
                    <Controller
                      name="selectionType"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleSelectionTypeChange("SINGLE", field.onChange)}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between cursor-pointer font-bold transition-all ${
                              field.value === "SINGLE"
                                ? "bg-[var(--primary)]/5 border-[var(--primary)] text-zinc-900 dark:text-white"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                            }`}
                          >
                            <span className="text-xs">Single Selection</span>
                            <span className="text-[9px] text-zinc-450 mt-1 font-semibold leading-relaxed">
                              Customers select only one add-on from this group (e.g. crust options).
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectionTypeChange("MULTIPLE", field.onChange)}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between cursor-pointer font-bold transition-all ${
                              field.value === "MULTIPLE"
                                ? "bg-[var(--primary)]/5 border-[var(--primary)] text-zinc-900 dark:text-white"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                            }`}
                          >
                            <span className="text-xs">Multiple Selection</span>
                            <span className="text-[9px] text-zinc-450 mt-1 font-semibold leading-relaxed">
                              Customers select multiple items up to a defined limit (e.g. pizza toppings).
                            </span>
                          </button>
                        </div>
                      )}
                    />
                  </div>

                  {/* Selection Constraints (Only visible when MULTIPLE) */}
                  {watchedSelectionType === "MULTIPLE" && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-850 rounded-xl animate-fade-in">
                      <div className="space-y-1">
                        <label className="block text-zinc-500 font-bold">Minimum Selection</label>
                        <input
                          type="number"
                          {...register("minSelection")}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        />
                        {errors.minSelection && <p className="text-[9.5px] text-red-650 font-bold">{errors.minSelection.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="block text-zinc-500 font-bold">Maximum Selection</label>
                        <input
                          type="number"
                          {...register("maxSelection")}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                        />
                        {errors.maxSelection && <p className="text-[9.5px] text-red-650 font-bold">{errors.maxSelection.message}</p>}
                      </div>
                    </div>
                  )}

                  {/* Required Switch */}
                  <div className="p-3 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center justify-between font-bold">
                    <div>
                      <span className="text-zinc-800 dark:text-zinc-250 block">Selection Required?</span>
                      <span className="text-[9.5px] text-zinc-400 font-semibold mt-0.5 block leading-none">Force customers to choose at least one item.</span>
                    </div>
                    <Controller
                      name="isRequired"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Included Add-ons Multi-Select Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[10px] text-zinc-455 font-black uppercase tracking-wider">Select Add-ons to Include</h4>
                    <span className="text-[9.5px] text-[var(--primary)] font-extrabold">{watchedAddonIds.length} Selected</span>
                  </div>

                  {/* Search within select list */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                    <input
                      type="text"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="Filter add-ons options..."
                      className="w-full pl-8.5 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-850 dark:text-zinc-200"
                    />
                  </div>

                  {/* Add-ons List Scroll Area */}
                  <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden max-h-[170px] overflow-y-auto scrollbar-thin divide-y divide-zinc-100 dark:divide-zinc-900 bg-zinc-50/10">
                    {filteredAddons.map((addon) => {
                      const isChecked = watchedAddonIds.includes(addon._id);
                      return (
                        <div
                          key={addon._id}
                          onClick={() => handleToggleAddon(addon._id)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-55/10 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Controlled by div onClick
                            className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] shrink-0 pointer-events-none"
                          />
                          <div className="w-6 h-6 rounded overflow-hidden shrink-0">
                            <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 font-bold">
                            <p className="text-[11px] text-zinc-900 dark:text-white truncate leading-none">{addon.name}</p>
                            <p className="text-[9px] text-zinc-400 mt-0.5">{addon.type} • ₹{addon.price}</p>
                          </div>
                          <span className={`px-2 py-0.2 rounded-full text-[8.5px] border ${
                            addon.status === "ACTIVE" 
                              ? "text-emerald-700 bg-emerald-50/80 border-emerald-200" 
                              : "text-zinc-500 bg-zinc-100 border-zinc-200"
                          }`}>
                            {addon.status}
                          </span>
                        </div>
                      );
                    })}

                    {filteredAddons.length === 0 && (
                      <div className="p-8 text-center text-zinc-400 flex flex-col items-center justify-center gap-1">
                        <AlertCircle size={16} />
                        <span>No add-ons match your query.</span>
                      </div>
                    )}
                  </div>
                  {errors.addonIds && <p className="text-[10px] text-red-650 font-bold">{errors.addonIds.message}</p>}
                </div>

              </div>

              {/* Live Preview (Right side) */}
              <div className="md:col-span-5 bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner flex flex-col justify-between max-h-[420px] font-bold">
                <div className="space-y-3">
                  <span className="text-[9.5px] uppercase font-bold text-zinc-400 block text-center">Group Summary</span>
                  
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-sm space-y-3 leading-relaxed">
                    <div>
                      <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Group Title</span>
                      <h4 className="text-zinc-900 dark:text-white font-extrabold text-sm">{watchedName}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-zinc-100 dark:border-zinc-900 pt-2.5">
                      <div>
                        <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Type</span>
                        <p className="text-zinc-800 dark:text-zinc-200">{watchedSelectionType === "SINGLE" ? "Single Select" : "Multi Select"}</p>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Constraints</span>
                        <p className="text-zinc-800 dark:text-zinc-200">
                          {watchedSelectionType === "SINGLE" ? "Min: 0 • Max: 1" : `Min: ${watchedMinSelection} • Max: ${watchedMaxSelection}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px]">
                      <span className="text-[8.5px] text-zinc-400 uppercase font-semibold">Requirement</span>
                      <p className="text-zinc-800 dark:text-zinc-200">{watchedRequired ? "Required Choice" : "Optional Customization"}</p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-900 pt-2.5 space-y-1">
                      <span className="text-[8.5px] text-zinc-400 uppercase font-semibold block">Included Add-ons ({watchedAddonIds.length})</span>
                      <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto scrollbar-thin">
                        {watchedAddonIds.map((aid) => {
                          const matched = allAddonsList.find((a) => a._id === aid);
                          return matched ? (
                            <span
                              key={aid}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-850 rounded text-[9.5px] text-zinc-800 dark:text-zinc-200 font-bold border border-zinc-200 dark:border-zinc-800"
                            >
                              <Check size={9} className="text-emerald-500" />
                              <span>{matched.name}</span>
                            </span>
                          ) : null;
                        })}
                        {watchedAddonIds.length === 0 && (
                          <span className="text-zinc-400 italic text-[10px] font-semibold">No add-ons selected yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-zinc-400 leading-normal text-center mt-4">
                  Groups let you configure customer validation rules during checkout custom Pizza selections.
                </p>
              </div>

            </div>

            {/* Footer Buttons */}
            <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-650 hover:bg-purple-700 text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
              >
                Create Group
              </button>
            </footer>
          </form>

        </div>
      </div>
    </div>
  );
}
