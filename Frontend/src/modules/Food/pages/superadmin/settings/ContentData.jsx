import React, { useState, useEffect, useMemo } from 'react';
import { Search, Home, Info, Utensils, Tag, MoreVertical } from 'lucide-react';

export default function ContentData() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debouncing logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const initialData = useMemo(() => [
    {
      id: 1,
      name: "Home Page",
      icon: Home,
      status: "Published",
      author: "Marco Rossi",
      lastModified: "2h ago",
      statusClass: "bg-green-100 text-green-800 border-green-200"
    },
    {
      id: 2,
      name: "About Us",
      icon: Info,
      status: "Published",
      author: "Sofia Conti",
      lastModified: "Yesterday",
      statusClass: "bg-green-100 text-green-800 border-green-200"
    },
    {
      id: 3,
      name: "Menu - Seasonal",
      icon: Utensils,
      status: "Draft",
      author: "Chef Alessandro",
      lastModified: "3d ago",
      statusClass: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    {
      id: 4,
      name: "Summer Offers",
      icon: Tag,
      status: "Pending",
      author: "Marketing Lead",
      lastModified: "Just now",
      statusClass: "bg-red-100 text-red-800 border-red-200"
    }
  ], []);

  const filteredData = useMemo(() => {
    return initialData.filter(page => 
      page.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      page.author.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      page.status.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, initialData]);

  return (
    <section className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between sm:items-center">
        <h3 className="text-xs font-bold text-black dark:text-white">Website Architecture</h3>
        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-700 transition-colors">
          <Search size={12} className="text-zinc-400 dark:text-zinc-500" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-xs w-full sm:w-32 md:w-48 outline-none text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500" 
            placeholder="Filter pages..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-zinc-55 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Page Name</th>
              <th className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</th>
              <th className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Author</th>
              <th className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Last Modified</th>
              <th className="px-3.5 py-1.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredData.length > 0 ? (
              filteredData.map(page => {
                const IconComponent = page.icon;
                return (
                  <tr key={page.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors group">
                    <td className="px-3.5 py-2">
                      <div className="flex items-center gap-2">
                        <IconComponent size={14} className="text-red-650 dark:text-red-400" />
                        <span className="text-xs font-bold text-black dark:text-white">{page.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border ${
                        page.status === 'Published' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' :
                        page.status === 'Draft' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' :
                        'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-xs font-semibold text-black/70 dark:text-white/70">{page.author}</td>
                    <td className="px-3.5 py-2 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">{page.lastModified}</td>
                    <td className="px-3.5 py-2 text-right">
                      <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 dark:text-zinc-400 rounded transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-3.5 py-4 text-center text-zinc-450 dark:text-zinc-555 text-xs font-medium">
                  No pages found matching "{debouncedSearch}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-2 bg-zinc-55 dark:bg-zinc-950/70 text-center border-t border-zinc-200 dark:border-zinc-800">
        <button className="text-red-650 dark:text-red-400 text-xs font-bold hover:underline">View All 248 Pages</button>
      </div>
    </section>
  );
}
