import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Store, 
  Warehouse, 
  CreditCard, 
  ChefHat, 
  Users, 
  Megaphone, 
  ScrollText,
  Search,
  CheckCircle2,
  Ban,
  HelpCircle,
  X,
  Smartphone
} from 'lucide-react';

const MODULES_DATA = [
  { id: 'dash', name: 'Dashboard', icon: LayoutDashboard, perms: [true, true, false, false, true, false, false] },
  { id: 'ord', name: 'Orders', icon: ShoppingBag, perms: [true, true, true, false, true, true, true] },
  { id: 'prod', name: 'Products', icon: Package, perms: [true, true, true, true, true, false, false] },
  { id: 'store', name: 'Stores', icon: Store, perms: [false, true, true, false, false, false, true] },
  { id: 'inv', name: 'Inventory', icon: Warehouse, perms: [true, true, true, false, true, true, false] },
  { id: 'fin', name: 'Financials', icon: CreditCard, perms: [false, true, false, false, true, false, false] },
  { id: 'staff', name: 'Kitchen Staff', icon: ChefHat, perms: [true, true, true, true, true, false, true] },
  { id: 'cust', name: 'Customer Data', icon: Users, perms: [false, true, false, false, true, false, false] },
  { id: 'mkt', name: 'Marketing', icon: Megaphone, perms: [true, true, true, false, false, false, false] },
  { id: 'audit', name: 'Audit Logs', icon: ScrollText, perms: [false, true, false, false, true, false, false] }
];

export default function RolesPermissionEdit({ role, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState(MODULES_DATA);
  const [showMobileHint, setShowMobileHint] = useState(true);

  const handleToggleAll = (checked) => {
    setModules(modules.map(m => ({
      ...m,
      perms: m.perms.map(() => checked)
    })));
  };

  const handleCheckboxChange = (modIndex, permIndex, checked) => {
    const newModules = [...modules];
    newModules[modIndex].perms[permIndex] = checked;
    setModules(newModules);
  };

  const filteredModules = modules.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Prevent clicks inside modal from closing it
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-zinc-950 w-full max-w-4xl h-full max-h-[75vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
        onClick={handleModalContentClick}
      >
        
        <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 w-full flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 shrink-0 gap-2">
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-1 rounded-lg transition-colors cursor-pointer active:opacity-80">
              <X className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-[var(--primary)] truncate">
              Edit Permissions: {role?.name || "Franchise Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full text-[9px] font-bold">DRAFT MODE</span>
            <button className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-1 rounded-lg transition-colors cursor-pointer active:opacity-80 hidden sm:block">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
            <input 
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none text-xs" 
              placeholder="Search modules..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => handleToggleAll(true)}
              className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors rounded-lg flex-1 md:flex-none justify-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Select All
            </button>
            <button 
              onClick={() => handleToggleAll(false)}
              className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors rounded-lg flex-1 md:flex-none justify-center"
            >
              <Ban className="w-3.5 h-3.5 text-rose-500" /> Clear All
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-auto bg-white dark:bg-zinc-950 scrollbar-thin">
          <div className="min-w-[900px] lg:min-w-full">
            <div className="sticky top-0 bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur-md z-10 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-[1.5fr_repeat(7,1fr)] items-center">
              <div className="px-4 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">MODULE NAME</div>
              <div className="text-center py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">CREATE</div>
              <div className="text-center py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">VIEW</div>
              <div className="text-center py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">UPDATE</div>
              <div className="text-center py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">DELETE</div>
              <div className="text-center py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">EXPORT</div>
              <div className="text-center py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">APPROVE</div>
              <div className="text-center py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">ASSIGN</div>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredModules.map((mod, modIndex) => {
                const IconComponent = mod.icon;
                return (
                  <div key={mod.id} className="grid grid-cols-[1.5fr_repeat(7,1fr)] items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                    <div className="px-4 py-1.5 flex items-center gap-2.5 border-r border-zinc-200/50 dark:border-zinc-800/50">
                      <IconComponent className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[var(--primary)] transition-colors shrink-0" />
                      <span className="text-xs font-semibold truncate">{mod.name}</span>
                    </div>
                    {mod.perms.map((p, permIndex) => (
                      <div key={permIndex} className={`text-center py-1.5 border-r border-zinc-200/50 dark:border-zinc-800/50 last:border-r-0 transition-colors ${p ? 'bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10' : ''}`}>
                        <label className="inline-flex items-center justify-center p-1 cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                          <input 
                            type="checkbox" 
                            className="rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer bg-white dark:bg-zinc-900"
                            checked={p}
                            onChange={(e) => handleCheckboxChange(modIndex, permIndex, e.target.checked)}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </main>

        <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex flex-col-reverse sm:flex-row items-center justify-between shrink-0 gap-3">
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-[9px] font-bold text-zinc-500">Last saved: 2 hours ago</span>
            <span className="text-[8px] text-zinc-400">Changes are currently staged</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-650 dark:text-zinc-350 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors rounded-lg uppercase tracking-wider">
              Cancel
            </button>
            <button className="flex-1 sm:flex-none px-5 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold hover:opacity-90 transition-all rounded-lg uppercase tracking-wider shadow-sm active:scale-95">
              Save
            </button>
          </div>
        </footer>
      </div>

      {showMobileHint && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-100 p-3 rounded-full shadow-lg z-[110] flex items-center gap-2 max-w-[90%] w-max">
          <Smartphone className="w-4 h-4" />
          <span className="text-[10px] font-bold">Landscape recommended</span>
          <button className="p-1 hover:bg-zinc-700 rounded-full transition-colors ml-1" onClick={() => setShowMobileHint(false)}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
