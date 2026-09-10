import React, { useState, useEffect } from "react";
import { X, Search, CheckSquare, Square } from "lucide-react";

export default function AssignTerritoryModal({ isOpen, onClose, onSubmit, zone }) {
  const [search, setSearch] = useState("");
  const [selectedTerritories, setSelectedTerritories] = useState([]);
  const [notes, setNotes] = useState("");

  // Mock available territories in India
  const [allTerritories] = useState([
    { id: "ter-001", name: "Bandra West", city: "Mumbai" },
    { id: "ter-002", name: "Andheri East", city: "Mumbai" },
    { id: "ter-003", name: "Koregaon Park", city: "Pune" },
    { id: "ter-004", name: "FC Road", city: "Pune" },
    { id: "ter-005", name: "Indiranagar", city: "Bengaluru" },
    { id: "ter-006", name: "Connaught Place", city: "Delhi" },
    { id: "ter-007", name: "Whitefield", city: "Bengaluru" },
    { id: "ter-008", name: "Gachibowli", city: "Hyderabad" },
    { id: "ter-009", name: "Salt Lake", city: "Kolkata" },
    { id: "ter-010", name: "T Nagar", city: "Chennai" },
    { id: "ter-011", name: "Vijay Nagar", city: "Indore" },
    { id: "ter-012", name: "Arera Colony", city: "Bhopal" }
  ]);

  useEffect(() => {
    if (zone && isOpen) {
      // Simulate reading already assigned territories (e.g. 2 mock assigned ones based on name)
      const assigned = allTerritories
        .slice(0, 3)
        .map((t) => t.id);
      setSelectedTerritories(assigned);
      setNotes("");
    }
  }, [zone, isOpen, allTerritories]);

  if (!isOpen || !zone) return null;

  const filtered = allTerritories.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.city.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedTerritories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const assignedObjects = allTerritories.filter((t) => selectedTerritories.includes(t.id));
    onSubmit({
      zoneId: zone.id,
      assignedTerritories: assignedObjects,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm lg:pl-[280px]" id="assign-territory-modal">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Assign Territories</h3>
            <p className="text-[10px] font-bold text-[var(--primary)] mt-0.5">Zone: {zone.name} ({zone.regionName})</p>
          </div>
          <button
            onClick={onClose}
            className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Parent Zone (Read-Only)</label>
            <input
              type="text"
              readOnly
              value={`${zone.name} — ${zone.regionName}`}
              className="w-full p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-black dark:text-zinc-300 opacity-80 cursor-not-allowed outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Select Territories *</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input
                type="text"
                placeholder="Search territories or cities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* List with height limit */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-40 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-900 scrollbar-thin">
              {filtered.length > 0 ? (
                filtered.map((t) => {
                  const isChecked = selectedTerritories.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleSelect(t.id)}
                      className="p-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-black dark:text-zinc-100">{t.name}</span>
                        <span className="text-[9px] font-semibold text-zinc-500">{t.city}</span>
                      </div>
                      <button className="text-zinc-500 hover:text-[var(--primary)]">
                        {isChecked ? (
                          <CheckSquare className="text-[var(--primary)] fill-[var(--primary)]/10" size={15} />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500 font-semibold">No territories matched.</div>
              )}
            </div>
            <div className="text-[9px] text-zinc-500 font-bold text-right">
              {selectedTerritories.length} Territories Selected
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Assignment Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any comments regarding territory allocation..."
              rows={2}
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-end gap-3 select-none">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-250 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
