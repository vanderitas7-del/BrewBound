import React from 'react';
import { CoffeeShop } from '../types';
import { isShopOpen } from '../utils/routing';
import { Wifi, Zap, Snowflake, Navigation, Heart, ShieldCheck, Clock } from 'lucide-react';

interface CoffeeCardProps {
  shop: CoffeeShop;
  isSelected?: boolean;
  isFavorite: boolean;
  onSelect: (shop: CoffeeShop) => void;
  onToggleFavorite: (e: React.MouseEvent, shopId: string) => void;
  onDirectNavigate: (e: React.MouseEvent, shop: CoffeeShop) => void;
}

export const CoffeeCard: React.FC<CoffeeCardProps> = ({
  shop,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onDirectNavigate,
}) => {
  const isOpen = isShopOpen(shop.openingTime, shop.closingTime);

  return (
    <div
      onClick={() => onSelect(shop)}
      className={`group relative bg-white rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex gap-3">
        {/* Thumbnail Image Slot */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
          <img
            src={shop.bannerImage}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-1 left-1 bg-amber-950/80 backdrop-blur-xs text-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
            {shop.barangayName}
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Top row: Name, rating, favorite */}
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-slate-900 text-sm truncate tracking-tight">
                    {shop.name}
                  </h3>
                  {shop.verified && (
                    <ShieldCheck className="w-4 h-4 text-blue-600 fill-blue-50 shrink-0" title="Verified by CCC Research" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                  <span className="font-semibold text-amber-700 flex items-center gap-0.5">
                    {shop.rating} ★
                  </span>
                  <span>•</span>
                  <span className="text-[11px] text-slate-500 truncate">{shop.landmark || shop.address}</span>
                </div>
              </div>

              {/* Bookmark button */}
              <button
                type="button"
                onClick={(e) => onToggleFavorite(e, shop.id)}
                className={`p-1.5 rounded-full transition-colors ${
                  isFavorite
                    ? 'text-rose-500 hover:bg-rose-50'
                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            {/* Amenity Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
              {/* Wi-Fi Speed Badge */}
              <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                <Wifi className="w-3 h-3 text-blue-600" />
                {shop.amenities.wifiSpeedMbps} Mbps
              </span>

              {/* Outlets Count Badge */}
              <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                {shop.amenities.outletCount} Outlets
              </span>

              {/* AC Badge */}
              {shop.amenities.acAvailable && (
                <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded-md font-medium">
                  <Snowflake className="w-3 h-3 text-sky-500" />
                  AC
                </span>
              )}
            </div>
          </div>

          {/* Bottom Bar: Status, Price, and Direct Navigate button */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                  isOpen
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                <Clock className="w-2.5 h-2.5" />
                {isOpen ? 'Open Now' : 'Closed'}
              </span>
              <span className="text-[11px] font-medium text-slate-600">
                {shop.priceRange}
              </span>
            </div>

            <button
              onClick={(e) => onDirectNavigate(e, shop)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold shadow-xs transition-colors"
            >
              <Navigation className="w-3 h-3" />
              <span>Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
