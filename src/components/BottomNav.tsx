import React from 'react';
import { Home, Search, Heart, Shield, Award } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'search' | 'favorites';
  onChangeTab: (tab: 'home' | 'search' | 'favorites') => void;
  favoritesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  favoritesCount,
}) => {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex items-center justify-around z-20 shrink-0 shadow-lg">
      {/* Home Tab */}
      <button
        onClick={() => onChangeTab('home')}
        className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-3 rounded-xl ${
          activeTab === 'home'
            ? 'text-amber-800 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        <span className="text-[11px] tracking-tight">Home</span>
      </button>

      {/* Search Tab */}
      <button
        onClick={() => onChangeTab('search')}
        className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-3 rounded-xl ${
          activeTab === 'search'
            ? 'text-amber-800 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Search className={`w-5 h-5 ${activeTab === 'search' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
        <span className="text-[11px] tracking-tight">Search</span>
      </button>

      {/* Favorites Tab */}
      <button
        onClick={() => onChangeTab('favorites')}
        className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-3 rounded-xl ${
          activeTab === 'favorites'
            ? 'text-amber-800 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <div className="relative">
          <Heart
            className={`w-5 h-5 ${
              activeTab === 'favorites' ? 'fill-amber-800 stroke-amber-800' : 'stroke-2'
            }`}
          />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {favoritesCount}
            </span>
          )}
        </div>
        <span className="text-[11px] tracking-tight">Favorites</span>
      </button>
    </nav>
  );
};
