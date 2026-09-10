import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';
import RolesPermissionEdit from './RolesPermissionEdit';

export default function RolesPermissionTable({ rolesList, onPreviewRole, onDeleteRole }) {
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [editingRole, setEditingRole] = useState(null);

   const [typeFilter, setTypeFilter] = useState("All");
   const [statusFilter, setStatusFilter] = useState("All");
   const [scopeFilter, setScopeFilter] = useState("All");

   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   // Debounce search input
   useEffect(() => {
      const handler = setTimeout(() => {
         setDebouncedSearch(searchTerm);
         setCurrentPage(1); // Reset to first page on search
      }, 300);
      return () => clearTimeout(handler);
   }, [searchTerm]);

   // Reset pagination on filter change
   useEffect(() => {
      setCurrentPage(1);
   }, [typeFilter, statusFilter, scopeFilter]);

   const filteredRoles = useMemo(() => {
      return rolesList.filter(role => {
         const matchSearch = role.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            role.subtitle.toLowerCase().includes(debouncedSearch.toLowerCase());
         const matchType = typeFilter === "All" || typeFilter.includes(role.type);
         const matchStatus = statusFilter === "All" || statusFilter.includes(role.status);
         const matchScope = scopeFilter === "All" || scopeFilter.includes(role.scope);

         return matchSearch && matchType && matchStatus && matchScope;
      });
   }, [rolesList, debouncedSearch, typeFilter, statusFilter, scopeFilter]);

   const totalPages = Math.max(1, Math.ceil(filteredRoles.length / itemsPerPage));
   const paginatedRoles = filteredRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
         {/* Filters */}
         <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex-1 min-w-[200px] relative">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black dark:text-white" size={14} />
               <input
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:border-[var(--primary)] focus:ring-0 outline-none transition-colors"
                  placeholder="Search roles, users, or permissions..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex flex-wrap items-center gap-2">
               <select
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:border-[var(--primary)] focus:ring-0 outline-none cursor-pointer"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
               >
                  <option value="All">Role Type: All</option>
                  <option value="System">System</option>
                  <option value="Custom">Custom</option>
               </select>
               <select
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:border-[var(--primary)] focus:ring-0 outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
               >
                  <option value="All">Status: All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
               </select>
               <select
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:border-[var(--primary)] focus:ring-0 outline-none cursor-pointer"
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
               >
                  <option value="All">Scope: All</option>
                  <option value="Zone-Restricted">Zone-Restricted</option>
                  <option value="Store-Restricted">Store-Restricted</option>
               </select>
               <button className="p-1.5 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Filter size={14} />
               </button>
            </div>
         </div>

         {/* Data Table */}
         <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                     <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Role Name</th>
                     <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Type</th>
                     <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Users</th>
                     <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Permissions</th>
                     <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Scope</th>
                     <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Status</th>
                     <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-white uppercase tracking-wider text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {paginatedRoles.length > 0 ? (
                     paginatedRoles.map((role) => (
                        <tr key={role.id} className="hover:bg-[var(--primary)]/5 dark:hover:bg-[var(--primary)]/10 transition-colors group">
                           <td className="px-3 py-2 cursor-pointer" onClick={() => onPreviewRole(role)}>
                              <div className="text-xs font-bold text-black dark:text-white group-hover:text-[var(--primary)] transition-colors">{role.name}</div>
                              <div className="text-[10px] text-black/70 dark:text-white/70 mt-0.5">{role.subtitle}</div>
                           </td>
                           <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${role.type === 'System' ? 'bg-zinc-100 dark:bg-zinc-800 text-black/70 dark:text-white/70' : 'bg-red-50 dark:bg-red-900/20 text-[var(--primary)]'}`}>{role.type}</span>
                           </td>
                           <td className="px-3 py-2 text-xs font-semibold text-black dark:text-white">{role.users}</td>
                           <td className="px-3 py-2 text-xs font-semibold text-black dark:text-white">
                              {role.permissionsCount} {role.permissionsTotal ? `/ ${role.permissionsTotal}` : ''}
                           </td>
                           <td className="px-3 py-2 text-xs font-semibold text-black dark:text-white">{role.scope}</td>
                           <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${role.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : role.status === 'Suspended' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-zinc-100 dark:bg-zinc-800 text-black/70 dark:text-white/70'}`}>
                                 {role.status}
                              </span>
                           </td>
                           <td className="px-3 py-2 text-right space-x-0.5">
                              <button onClick={() => onPreviewRole(role)} className="text-black/60 dark:text-white/60 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded-lg transition-colors"><Eye size={14} /></button>
                              <button onClick={() => setEditingRole(role)} className="text-black/60 dark:text-white/60 hover:text-[var(--primary)] p-1 rounded-lg transition-colors"><Edit size={14} /></button>
                              <button
                                 onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
                                       onDeleteRole(role.id);
                                    }
                                 }}
                                 className="text-black/60 dark:text-white/60 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                                 title="Delete role"
                              >
                                 <Trash2 size={14} />
                              </button>
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan="7" className="px-3 py-6 text-center text-black/50 dark:text-white/50 text-xs">
                           No roles match the selected filters.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         {filteredRoles.length > 0 && (
            <div className="px-3 py-2 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
               <div className="text-[11px] font-medium text-black/70 dark:text-white/70">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
               </div>
               <div className="flex items-center gap-1">
                  <button
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="w-6 h-6 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                     <ChevronLeft size={12} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                     <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${currentPage === i + 1 ? 'bg-[var(--primary)] text-white' : 'border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                     >
                        {i + 1}
                     </button>
                  ))}
                  <button
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                     className="w-6 h-6 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                     <ChevronRight size={12} />
                  </button>
               </div>
            </div>
         )}

         {/* Roles Permission Edit Modal */}
         {editingRole && (
            <RolesPermissionEdit
               role={editingRole}
               onClose={() => setEditingRole(null)}
            />
         )}
      </div>
   );
}
