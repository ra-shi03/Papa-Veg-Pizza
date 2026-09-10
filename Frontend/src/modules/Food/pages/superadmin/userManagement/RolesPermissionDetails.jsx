import React, { useState } from 'react';
import {
  Shield,
  X,
  CheckCircle,
  XCircle,
  Building2,
  ShoppingCart,
  Package,
  Warehouse,
  ChevronRight
} from 'lucide-react';
import RolesPermissionEdit from './RolesPermissionEdit';
import AuditLogsModal from './AuditLogsModal';

export default function RolesPermissionDetails({ isOpen, onClose, role }) {
  if (!role) return null;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white dark:bg-zinc-950 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out border-l border-zinc-200 dark:border-zinc-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Drawer Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <Shield className="text-[var(--primary)]" size={18} />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">View Role</h3>
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">ID: ROLE-{role.id?.toString().padStart(5, '0')}</p>
            </div>
          </div>
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Section 1: Core Identification */}
          <section className="p-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">Core Identification</h4>
            <div className="grid grid-cols-2 gap-y-3">
              <div>
                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-505 uppercase mb-0.5">Role Name</p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{role.name}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase mb-0.5">Slug</p>
                <p className="font-mono text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 rounded w-fit">
                  {role.name?.toLowerCase().replace(/\s+/g, '-')}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-0.5">Type</p>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{role.type} Role</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-0.5">Scope</p>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{role.scope}</p>
              </div>
            </div>
          </section>

          {/* Section 2: Privilege Boundary */}
          <section className="p-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Privilege Boundary</h4>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded mb-1.5">
              <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">{role.scope} Access</span>
            </div>
            <p className="text-xs text-zinc-650 dark:text-zinc-450 leading-relaxed mt-0.5">
              {role.description || "Users with this role are permitted to manage operations within their assigned scope. Global system settings are restricted."}
            </p>
          </section>

          {/* Section 3: Assigned Users */}
          <section className="p-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-2.5">
              <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Assigned Users ({role.users || 24})
              </h4>
              <button className="text-[var(--primary)] font-bold text-[9px] hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:shadow-sm transition-shadow cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-[10px]">JS</div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50">James Stewart</p>
                    <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">Downtown Plaza Store</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-400" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:shadow-sm transition-shadow cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">ML</div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50">Maria Lopez</p>
                    <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">Westside Avenue Hub</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-400" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100 hover:shadow-sm transition-shadow cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">RK</div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50">Robert King</p>
                    <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">Airport Terminal T3</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-400" />
              </div>
            </div>
          </section>

          {/* Section 4: Module-Level Permissions */}
          <section className="p-3.5">
            <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">Module-Level Permissions</h4>
            <div className="space-y-2">
              {/* Orders Module */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50">Orders</span>
                  <ShoppingCart size={13} className="text-zinc-500" />
                </div>
                <div className="p-2 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Create</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">View</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Update</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <XCircle size={13} className="text-zinc-400 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-500">Delete</span>
                  </div>
                </div>
              </div>

              {/* Products Module */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50">Products</span>
                  <Package size={13} className="text-zinc-500" />
                </div>
                <div className="p-2 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 opacity-40">
                    <XCircle size={13} className="text-zinc-400 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-500">Create</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">View</span>
                  </div>
                </div>
              </div>

              {/* Inventory Module */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50">Inventory</span>
                  <Warehouse size={13} className="text-zinc-500" />
                </div>
                <div className="p-2 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">View</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <XCircle size={13} className="text-zinc-400 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-500">Manage</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-2 mt-auto">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 bg-[var(--primary)] text-white py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--primary)]/90 transition-colors shadow-md shadow-[var(--primary)]/20 cursor-pointer"
          >
            Edit Permissions
          </button>
          <button 
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 py-1.5 rounded-lg text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Audit Logs
          </button>
        </div>
      </div>

      {isEditModalOpen && (
        <RolesPermissionEdit 
          role={role} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}

      {isAuditModalOpen && (
        <AuditLogsModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}
    </>
  );
}