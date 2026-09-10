import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  useRegions, 
  useZones, 
  useFranchises, 
  useStores,
  useCreateIncentive 
} from '../hooks/useDeliveryAnalyticsQuery';

export default function CreateIncentiveModal({ isOpen, onClose }) {
  const { data: regions } = useRegions();
  const { data: franchises } = useFranchises();
  const { data: stores } = useStores();
  
  const { create, submitting } = useCreateIncentive();

  // Form States
  const [targetDeliveries, setTargetDeliveries] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleType, setVehicleType] = useState('All');
  
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedFranchises, setSelectedFranchises] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);

  // Fetch zones for selected regions
  // We can combine all zones of selected regions into a single list
  const [availableZones, setAvailableZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(false);

  useEffect(() => {
    if (selectedRegions.length === 0) {
      setAvailableZones([]);
      setSelectedZones([]);
      return;
    }

    (async () => {
      setLoadingZones(true);
      try {
        // Fetch zones for each region in parallel
        const promises = selectedRegions.map(async (rId) => {
          try {
            // Mock connection check logic or retrieve via API
            // For mock logic, we'll fetch them from mock storage or API
            // To be safe, we simulate getting zones or make API call
            const res = await fetchZonesForRegion(rId);
            return res;
          } catch {
            return [];
          }
        });
        const results = await Promise.all(promises);
        const combined = results.flat();
        setAvailableZones(combined);
      } catch {
        setAvailableZones([]);
      } finally {
        setLoadingZones(false);
      }
    })();
  }, [selectedRegions]);

  const fetchZonesForRegion = async (regionId) => {
    // Mimic API structure or mock data
    const MOCK_ZONES = {
      'reg-north': [{ id: 'zone-delhi', name: 'Delhi NCR' }, { id: 'zone-up', name: 'Uttar Pradesh' }],
      'reg-central': [{ id: 'zone-mp', name: 'Madhya Pradesh' }, { id: 'zone-cg', name: 'Chhattisgarh' }],
      'reg-west': [{ id: 'zone-mh', name: 'Maharashtra' }, { id: 'zone-gj', name: 'Gujarat' }],
      'reg-south': [{ id: 'zone-kar', name: 'Karnataka' }, { id: 'zone-tn', name: 'Tamil Nadu' }]
    };
    return MOCK_ZONES[regionId] || [];
  };

  const handleToggleRegion = (id) => {
    setSelectedRegions(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleToggleZone = (id) => {
    setSelectedZones(prev => 
      prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
    );
  };

  const handleToggleFranchise = (id) => {
    setSelectedFranchises(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleToggleStore = (id) => {
    setSelectedStores(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetDeliveries || !bonusAmount || !startDate || !endDate) {
      return;
    }

    const payload = {
      targetDeliveries: Number(targetDeliveries),
      bonusAmount: Number(bonusAmount),
      startDate,
      endDate,
      regions: selectedRegions,
      zones: selectedZones,
      franchises: selectedFranchises,
      stores: selectedStores,
      vehicleType
    };

    const success = await create(payload);
    if (success) {
      // Reset form & close
      setTargetDeliveries('');
      setBonusAmount('');
      setStartDate('');
      setEndDate('');
      setVehicleType('All');
      setSelectedRegions([]);
      setSelectedZones([]);
      setSelectedFranchises([]);
      setSelectedStores([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[700px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-hidden my-auto font-semibold text-xs text-zinc-800 dark:text-zinc-200">
        
        {/* Modal Header */}
        <header className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 rounded-t-2xl shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[var(--primary)] animate-pulse" size={16} />
            <h2 className="text-sm font-extrabold text-black dark:text-white uppercase tracking-wider">Create Incentive bonus scheme</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-105 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </header>

        {/* Form Body Scroll area */}
        <main className="flex-1 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target and Bonus values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Target Deliveries Count</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  required
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg outline-none text-xs text-black dark:text-white font-extrabold focus:border-[var(--primary)]"
                  value={targetDeliveries}
                  onChange={(e) => setTargetDeliveries(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Bonus Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  required
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg outline-none text-xs text-black dark:text-white font-extrabold focus:border-[var(--primary)]"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Start and End dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  required
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg outline-none text-xs text-black dark:text-white font-bold focus:border-[var(--primary)]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  required
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg outline-none text-xs text-black dark:text-white font-bold focus:border-[var(--primary)]"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Vehicle Type selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Applicable Vehicle Type</label>
              <select
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg outline-none text-xs text-black dark:text-white font-extrabold cursor-pointer"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="All">All Vehicle Types</option>
                <option value="Bike">Bike</option>
                <option value="Scooter">Scooter</option>
                <option value="Cycle">Cycle</option>
                <option value="Car">Car</option>
              </select>
            </div>

            {/* Applicable Regions Multi-select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Applicable Regions</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-24 overflow-y-auto scrollbar-thin">
                {regions?.map(r => {
                  const isSelected = selectedRegions.includes(r.id);
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => handleToggleRegion(r.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]' 
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350'
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Applicable Zones Multi-select */}
            {selectedRegions.length > 0 && (
              <div className="flex flex-col gap-1 animate-fade-down">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  Applicable Zones {loadingZones && '(Loading...)'}
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-24 overflow-y-auto scrollbar-thin">
                  {availableZones.map(z => {
                    const isSelected = selectedZones.includes(z.id);
                    return (
                      <button
                        type="button"
                        key={z.id}
                        onClick={() => handleToggleZone(z.id)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]' 
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350'
                        }`}
                      >
                        {z.name}
                      </button>
                    );
                  })}
                  {availableZones.length === 0 && (
                    <p className="text-[10px] text-zinc-400 italic pl-1">No zones found for selected regions.</p>
                  )}
                </div>
              </div>
            )}

            {/* Applicable Franchises Multi-select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Applicable Franchises</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-24 overflow-y-auto scrollbar-thin">
                {franchises?.map(f => {
                  const isSelected = selectedFranchises.includes(f.id);
                  return (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => handleToggleFranchise(f.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]' 
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350'
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Applicable Stores Multi-select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Applicable Stores</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-24 overflow-y-auto scrollbar-thin">
                {stores?.map(s => {
                  const isSelected = selectedStores.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => handleToggleStore(s.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]' 
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info warning alert */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-550/20 rounded-xl text-amber-700 dark:text-amber-450">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                Rider incentive schemes will execute automatically once couriers complete the targeted deliveries. Double check applicable regions and stores before saving.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg font-extrabold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4.5 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 font-extrabold shadow cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Incentive'}
              </button>
            </div>

          </form>
        </main>

      </div>
    </div>
  );
}
