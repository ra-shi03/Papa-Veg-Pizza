import React, { useState, useEffect } from "react";
import { X, ChevronDown, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_MODULES = [
    {name: "Dashboard", rights: [true, false, false, false, true, false, false]},
    {name: "Orders", rights: [true, true, true, false, true, true, true]},
    {name: "Products", rights: [true, true, true, true, true, false, false]},
    {name: "Stores", rights: [true, false, true, false, false, false, false]},
    {name: "Inventory", rights: [true, true, true, false, true, false, true]},
    {name: "User Management", rights: [true, true, true, false, false, false, true]},
    {name: "Audit Logs", rights: [true, false, false, false, true, false, false]},
    {name: "Financials", rights: [true, false, false, false, true, true, false]}
];

export default function CreateRoleModal({ isOpen, onClose }) {
  const [roleName, setRoleName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("franchise");
  
  const [permissions, setPermissions] = useState(INITIAL_MODULES);

  // Auto-generate slug
  useEffect(() => {
    setSlug(roleName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
  }, [roleName]);

  const handleSelectAll = () => {
    setPermissions(prev => prev.map(mod => ({ ...mod, rights: Array(7).fill(true) })));
  };

  const handleClearAll = () => {
    setPermissions(prev => prev.map(mod => ({ ...mod, rights: Array(7).fill(false) })));
  };

  const handleTogglePermission = (modIndex, rightIndex) => {
    setPermissions(prev => {
      const newPerms = [...prev];
      const newRights = [...newPerms[modIndex].rights];
      newRights[rightIndex] = !newRights[rightIndex];
      newPerms[modIndex] = { ...newPerms[modIndex], rights: newRights };
      return newPerms;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-zinc-950/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Create New Role</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
                {/* Identification */}
                <section className="space-y-2.5">
                  <div className="flex items-center gap-1.5 border-l-2 border-[var(--primary)] pl-2 mb-2">
                    <h3 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">Role Identification</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Role Name</label>
                      <input
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="e.g. Regional Manager"
                        className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Role Slug</label>
                      <input
                        type="text"
                        readOnly
                        value={slug}
                        className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Description</label>
                    <textarea
                      rows="2"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Define the primary purpose and scope of this role..."
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
                    ></textarea>
                  </div>
                </section>

                {/* Access */}
                <section className="space-y-2.5">
                  <div className="flex items-center gap-1.5 border-l-2 border-blue-500 pl-2 mb-2">
                    <h3 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">Access Configuration</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Access Scope</label>
                      <div className="relative">
                        <select
                          value={scope}
                          onChange={(e) => setScope(e.target.value)}
                          className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="global">Global Access</option>
                          <option value="franchise">Franchise Access</option>
                          <option value="store">Store Access</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Role Type</label>
                      <div className="bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <ShieldCheck size={14} className="text-blue-500" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Custom Role</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Matrix */}
                <section className="space-y-2.5 pb-2">
                  <div className="flex flex-wrap items-center justify-between border-l-2 border-zinc-800 dark:border-zinc-400 pl-2 mb-2 gap-2">
                    <h3 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">Permission Selection Matrix</h3>
                    <div className="flex gap-2">
                      <button onClick={handleSelectAll} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded transition-colors uppercase cursor-pointer">Select All</button>
                      <button onClick={handleClearAll} className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded transition-colors uppercase cursor-pointer">Clear All</button>
                    </div>
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                          <tr>
                            <th className="px-2.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase border-r border-zinc-200 dark:border-zinc-800 w-36">Modules</th>
                            <th className="px-1.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">View</th>
                            <th className="px-1.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">Create</th>
                            <th className="px-1.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">Update</th>
                            <th className="px-1.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">Delete</th>
                            <th className="px-1.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">Export</th>
                            <th className="px-1.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">Approve</th>
                            <th className="px-1.5 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase text-center">Assign</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {permissions.map((mod, mIdx) => (
                            <tr key={mod.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="px-2.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">{mod.name}</td>
                              {mod.rights.map((checked, rIdx) => (
                                <td key={rIdx} className="px-1.5 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleTogglePermission(mIdx, rIdx)}
                                    className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-[var(--primary)]/20 transition-all cursor-pointer bg-transparent"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-end gap-2 rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { alert("Role Created Successfully!"); onClose(); }}
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--primary)]/90 transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  Create Role
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
