import React, { useState } from 'react';
import { FilterState } from '../types';
import { BARANGAYS_LIST } from '../data/calambaLandmarks';
import { Search, Zap, Wifi, Snowflake, MapPin, Clock, X, SlidersHorizontal, Check } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  resultCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  resultCount,
}) => {
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showBarangayMenu, setShowBarangayMenu] = useState(false);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.barangay !== 'all' ||
    filters.requireOutlets ||
    filters.requireWifi ||
    filters.requireAC ||
    filters.openNowOnly ||
    filters.priceCategory !== 'all' ||
    filters.noiseLevel !== 'all';

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-xs">
      {/* Search Input Box */}
      <div className="relative flex items-center mb-2.5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="Search coffee shop, menu item, or barangay..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Horizontal Scrollable Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {/* Outlets Filter Pill */}
        <button
          onClick={() => onFilterChange({ requireOutlets: !filters.requireOutlets })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
            filters.requireOutlets
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${filters.requireOutlets ? 'text-amber-200 fill-amber-200' : 'text-amber-500'}`} />
          <span>Outlets</span>
        </button>

        {/* Wi-Fi Filter Pill */}
        <button
          onClick={() => onFilterChange({ requireWifi: !filters.requireWifi })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
            filters.requireWifi
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Wifi className={`w-3.5 h-3.5 ${filters.requireWifi ? 'text-amber-200' : 'text-blue-500'}`} />
          <span>Wi-Fi</span>
        </button>

        {/* AC Space Filter Pill */}
        <button
          onClick={() => onFilterChange({ requireAC: !filters.requireAC })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
            filters.requireAC
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Snowflake className={`w-3.5 h-3.5 ${filters.requireAC ? 'text-amber-200' : 'text-sky-500'}`} />
          <span>AC Space</span>
        </button>

        {/* Barangay Filter Selector */}
        <div className="relative">
          <button
            onClick={() => setShowBarangayMenu(!showBarangayMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              filters.barangay !== 'all'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${filters.barangay !== 'all' ? 'text-amber-200' : 'text-rose-500'}`} />
            <span>
              {filters.barangay === 'all'
                ? 'Barangay'
                : `Brgy ${filters.barangay}`}
            </span>
          </button>

          {showBarangayMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onFilterChange({ barangay: 'all' });
                  setShowBarangayMenu(false);
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-amber-50 flex items-center justify-between font-medium"
              >
                <span>All Poblacion Barangays (1-7)</span>
                {filters.barangay === 'all' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              {BARANGAYS_LIST.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    onFilterChange({ barangay: b.id });
                    setShowBarangayMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-amber-50 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold">{b.shortName}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{b.landmark}</span>
                  </div>
                  {filters.barangay === b.id && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Open Now Pill */}
        <button
          onClick={() => onFilterChange({ openNowOnly: !filters.openNowOnly })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
            filters.openNowOnly
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${filters.openNowOnly ? 'text-amber-200' : 'text-emerald-600'}`} />
          <span>Open Now</span>
        </button>

        {/* More Filters Toggle */}
        <button
          onClick={() => setShowAdvancedModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>More</span>
        </button>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Result Counter Status */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
        <span>
          Showing <strong className="text-slate-800 font-semibold">{resultCount}</strong> verified coffee shops
        </span>
        {filters.barangay !== 'all' && (
          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
            Barangay {filters.barangay}
          </span>
        )}
      </div>

      {/* Advanced Filter Modal */}
      {showAdvancedModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                Refine Search Filters
              </h3>
              <button
                onClick={() => setShowAdvancedModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Noise Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Atmosphere & Noise Level
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => onFilterChange({ noiseLevel: 'all' })}
                    className={`py-2 px-3 rounded-lg border text-center font-medium ${
                      filters.noiseLevel === 'all'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Any Atmosphere
                  </button>
                  <button
                    onClick={() => onFilterChange({ noiseLevel: 'Quiet / Study-Friendly' })}
                    className={`py-2 px-3 rounded-lg border text-center font-medium ${
                      filters.noiseLevel === 'Quiet / Study-Friendly'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🤫 Quiet & Study
                  </button>
                </div>
              </div>

              {/* Price Tier */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Price Tier
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => onFilterChange({ priceCategory: 'all' })}
                    className={`py-2 rounded-lg border font-medium ${
                      filters.priceCategory === 'all'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => onFilterChange({ priceCategory: 'budget' })}
                    className={`py-2 rounded-lg border font-medium ${
                      filters.priceCategory === 'budget'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₱ (&lt; ₱150)
                  </button>
                  <button
                    onClick={() => onFilterChange({ priceCategory: 'mid' })}
                    className={`py-2 rounded-lg border font-medium ${
                      filters.priceCategory === 'mid'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₱₱ (₱150 - ₱250)
                  </button>
                </div>
              </div>

              {/* Minimum Fiber Speed */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Minimum Wi-Fi Speed ({filters.minWifiSpeed || 0} Mbps)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={filters.minWifiSpeed}
                  onChange={(e) => onFilterChange({ minWifiSpeed: Number(e.target.value) })}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 Mbps</span>
                  <span>50 Mbps</span>
                  <span>100+ Mbps</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={onResetFilters}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowAdvancedModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
