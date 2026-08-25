import React, { useState, useEffect, useMemo } from 'react';
import { CoffeeShop, FilterState, LocationPoint, NavigationState } from './types';
import { INITIAL_COFFEE_SHOPS } from './data/coffeeShops';
import { CALAMBA_LANDMARKS } from './data/calambaLandmarks';
import { MapView } from './components/MapView';
import { FilterBar } from './components/FilterBar';
import { CoffeeCard } from './components/CoffeeCard';
import { CoffeeDetailsModal } from './components/CoffeeDetailsModal';
import { NavigationView } from './components/NavigationView';
import { BottomNav } from './components/BottomNav';
import { AdminPortal } from './components/AdminPortal';
import { IsoEvaluationModal } from './components/IsoEvaluationModal';
import { ResearchInfoModal } from './components/ResearchInfoModal';
import { generateRoute, fetchFreeOsrmRoute, isShopOpen } from './utils/routing';
import {
  Coffee,
  Database,
  Award,
  GraduationCap,
  Smartphone,
  Maximize2,
  MapPin,
  Shield,
  Layers
} from 'lucide-react';

export default function App() {
  // Main Portal State: 'user' (Public Discovery & Navigation) vs 'admin' (Data Administration & GIS Management)
  const [portalMode, setPortalMode] = useState<'user' | 'admin'>('user');

  // State: Coffee shops data
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>(() => {
    // Clear legacy populated dummy entries if previously loaded
    const saved = localStorage.getItem('brewbound_cafes_data_v2');
    return saved ? JSON.parse(saved) : INITIAL_COFFEE_SHOPS;
  });

  useEffect(() => {
    localStorage.setItem('brewbound_cafes_data_v2', JSON.stringify(coffeeShops));
  }, [coffeeShops]);

  // State: Bookmarked favorites (only keep IDs that exist in coffee shops)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('brewbound_saved_favorites_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Keep favorites strictly synchronized with actual available coffee shops
  const validFavorites = useMemo(() => {
    const validIds = new Set(coffeeShops.map((s) => s.id));
    return favorites.filter((id) => validIds.has(id));
  }, [coffeeShops, favorites]);

  // Clean up favorites storage whenever coffee shops list changes
  useEffect(() => {
    if (favorites.length !== validFavorites.length) {
      setFavorites(validFavorites);
    }
  }, [validFavorites, favorites.length]);

  useEffect(() => {
    localStorage.setItem('brewbound_saved_favorites_v2', JSON.stringify(validFavorites));
  }, [validFavorites]);

  // State: Selected coffee shop for details modal
  const [selectedShop, setSelectedShop] = useState<CoffeeShop | null>(null);

  // State: User current location (default: City College of Calamba)
  const [userLocation, setUserLocation] = useState<LocationPoint>(CALAMBA_LANDMARKS[0]);

  // State: Active bottom nav tab
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'favorites'>('home');

  // State: Device View Mode (Mobile Mockup Frame vs Full Fluid Web View)
  const [isMobileFrameView, setIsMobileFrameView] = useState(false);

  // State: Academic modals
  const [showIsoModal, setShowIsoModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);

  // State: Filtering
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    barangay: 'all',
    requireOutlets: false,
    minOutlets: 0,
    requireWifi: false,
    minWifiSpeed: 0,
    requireAC: false,
    openNowOnly: false,
    priceCategory: 'all',
    noiseLevel: 'all',
  });

  // State: Navigation
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isActive: false,
    destinationShop: null,
    originLocation: CALAMBA_LANDMARKS[0],
    travelMode: 'walking',
    routePoints: [],
    totalDistanceKm: 0,
    estimatedTimeMins: 0,
    steps: [],
    currentStepIndex: 0,
    simulatedProgress: 0,
  });

  // Filtered Coffee Shops for User Discovery Portal
  const filteredShops = useMemo(() => {
    return coffeeShops.filter((shop) => {
      // Tab specific filter
      if (activeTab === 'favorites' && !validFavorites.includes(shop.id)) {
        return false;
      }

      // Search Query (matches name, barangay, landmark, or menu items)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = shop.name.toLowerCase().includes(query);
        const matchesBgy = shop.barangayName.toLowerCase().includes(query);
        const matchesLandmark = shop.landmark.toLowerCase().includes(query);
        const matchesMenu = shop.menu.some((m) => m.name.toLowerCase().includes(query));
        if (!matchesName && !matchesBgy && !matchesLandmark && !matchesMenu) {
          return false;
        }
      }

      // Barangay filter (1 to 7)
      if (filters.barangay !== 'all' && shop.barangayId !== filters.barangay) {
        return false;
      }

      // Amenities: Outlets
      if (filters.requireOutlets && shop.amenities.outletCount < (filters.minOutlets || 1)) {
        return false;
      }

      // Amenities: Wi-Fi
      if (filters.requireWifi && (!shop.amenities.wifiAvailable || shop.amenities.wifiSpeedMbps < filters.minWifiSpeed)) {
        return false;
      }

      // Amenities: AC
      if (filters.requireAC && !shop.amenities.acAvailable) {
        return false;
      }

      // Open Now
      if (filters.openNowOnly && !isShopOpen(shop.openingTime, shop.closingTime)) {
        return false;
      }

      // Price Category
      if (filters.priceCategory === 'budget' && shop.minPrice > 150) return false;
      if (filters.priceCategory === 'mid' && (shop.minPrice < 150 || shop.maxPrice > 250)) return false;

      // Noise Level
      if (filters.noiseLevel !== 'all' && shop.amenities.noiseLevel !== filters.noiseLevel) {
        return false;
      }

      return true;
    });
  }, [coffeeShops, filters, activeTab, favorites]);

  // Toggle Favorite
  const handleToggleFavorite = (e: React.MouseEvent | null, shopId: string) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
    );
  };

  // Start Navigation to Cafe
  const handleStartNavigation = async (shop: CoffeeShop) => {
    const route = generateRoute(userLocation, shop, navigationState.travelMode);
    setNavigationState({
      isActive: true,
      destinationShop: shop,
      originLocation: userLocation,
      travelMode: navigationState.travelMode,
      routePoints: route.points,
      totalDistanceKm: route.totalDistanceKm,
      estimatedTimeMins: route.estimatedTimeMins,
      steps: route.steps,
      currentStepIndex: 0,
      simulatedProgress: 0,
    });
    setSelectedShop(null);

    // Asynchronously refine with 100% Free OpenStreetMap OSRM live routing API
    try {
      const liveRoute = await fetchFreeOsrmRoute(userLocation, shop, navigationState.travelMode);
      setNavigationState((prev) => ({
        ...prev,
        routePoints: liveRoute.points,
        totalDistanceKm: liveRoute.totalDistanceKm,
        estimatedTimeMins: liveRoute.estimatedTimeMins,
        steps: liveRoute.steps,
      }));
    } catch {
      // Retain calibrated initial route
    }
  };

  // Cancel Navigation
  const handleCancelNavigation = () => {
    setNavigationState((prev) => ({
      ...prev,
      isActive: false,
      destinationShop: null,
      routePoints: [],
    }));
  };

  // Change Navigation Travel Mode
  const handleChangeTravelMode = async (mode: 'walking' | 'tricycle' | 'driving') => {
    if (!navigationState.destinationShop) return;
    const dest = navigationState.destinationShop;
    const origin = navigationState.originLocation;

    const route = generateRoute(origin, dest, mode);
    setNavigationState((prev) => ({
      ...prev,
      travelMode: mode,
      routePoints: route.points,
      totalDistanceKm: route.totalDistanceKm,
      estimatedTimeMins: route.estimatedTimeMins,
      steps: route.steps,
      currentStepIndex: 0,
    }));

    try {
      const liveRoute = await fetchFreeOsrmRoute(origin, dest, mode);
      setNavigationState((prev) => ({
        ...prev,
        travelMode: mode,
        routePoints: liveRoute.points,
        totalDistanceKm: liveRoute.totalDistanceKm,
        estimatedTimeMins: liveRoute.estimatedTimeMins,
        steps: liveRoute.steps,
      }));
    } catch {
      // Retain route
    }
  };

  // Change Origin Point
  const handleChangeOrigin = async (origin: LocationPoint) => {
    setUserLocation(origin);
    if (navigationState.destinationShop) {
      const dest = navigationState.destinationShop;
      const route = generateRoute(origin, dest, navigationState.travelMode);
      setNavigationState((prev) => ({
        ...prev,
        originLocation: origin,
        routePoints: route.points,
        totalDistanceKm: route.totalDistanceKm,
        estimatedTimeMins: route.estimatedTimeMins,
        steps: route.steps,
      }));

      try {
        const liveRoute = await fetchFreeOsrmRoute(origin, dest, navigationState.travelMode);
        setNavigationState((prev) => ({
          ...prev,
          originLocation: origin,
          routePoints: liveRoute.points,
          totalDistanceKm: liveRoute.totalDistanceKm,
          estimatedTimeMins: liveRoute.estimatedTimeMins,
          steps: liveRoute.steps,
        }));
      } catch {
        // Retain route
      }
    }
  };

  // Update Filter Helper
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      barangay: 'all',
      requireOutlets: false,
      minOutlets: 0,
      requireWifi: false,
      minWifiSpeed: 0,
      requireAC: false,
      openNowOnly: false,
      priceCategory: 'all',
      noiseLevel: 'all',
    });
  };

  // Admin Actions
  const handleSaveShop = (updatedShop: CoffeeShop) => {
    setCoffeeShops((prev) => {
      const exists = prev.find((s) => s.id === updatedShop.id);
      if (exists) {
        return prev.map((s) => (s.id === updatedShop.id ? updatedShop : s));
      } else {
        return [updatedShop, ...prev];
      }
    });
  };

  const handleDeleteShop = (shopId: string) => {
    setCoffeeShops((prev) => prev.filter((s) => s.id !== shopId));
  };

  const handleResetDefaultData = () => {
    setCoffeeShops(INITIAL_COFFEE_SHOPS);
  };

  // -------------------------------------------------------------
  // DEDICATED DATA ADMINISTRATION INTERFACE VIEW
  // -------------------------------------------------------------
  if (portalMode === 'admin') {
    return (
      <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950">
        <AdminPortal
          coffeeShops={coffeeShops}
          onSaveShop={handleSaveShop}
          onDeleteShop={handleDeleteShop}
          onResetDefaultData={handleResetDefaultData}
          onSwitchToUserPortal={() => setPortalMode('user')}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // USER DISCOVERY & NAVIGATION INTERFACE VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex flex-col items-center justify-start p-0 sm:p-3 md:p-4 select-none sm:select-auto font-sans">
      
      {/* Top Portal Navigation Header */}
      <header className="w-full max-w-6xl mb-2 px-3 sm:px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-800 text-white flex items-center justify-between shadow-lg z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            ☕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-sm text-amber-400">
                BREWBOUND
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded hidden sm:inline">
                User Discovery Portal • Poblacion 1–7
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Portal Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Research Info Modal Trigger */}
          <button
            onClick={() => setShowResearchModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            title="View Academic Research & Team Info"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Research</span>
          </button>

          {/* ISO 25010 Quality Evaluation Modal Trigger */}
          <button
            onClick={() => setShowIsoModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            title="ISO/IEC 25010:2011 Software Evaluation Form"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">ISO 25010</span>
          </button>

          {/* Switch to Data Administration Interface */}
          <button
            onClick={() => setPortalMode('admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            title="Open Data Administration Interface"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Admin Portal</span>
          </button>

          {/* Toggle Mobile Phone Frame vs Fluid Layout */}
          <button
            onClick={() => setIsMobileFrameView(!isMobileFrameView)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors hidden sm:flex"
            title={isMobileFrameView ? 'Switch to Fluid Desktop Layout' : 'Switch to Mobile App Wireframe View'}
          >
            {isMobileFrameView ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Container (Mobile Device Frame or Fluid Layout) */}
      <main
        className={`w-full transition-all duration-300 ${
          isMobileFrameView
            ? 'max-w-sm rounded-[36px] ring-8 ring-slate-800 shadow-2xl border-4 border-slate-700 overflow-hidden h-[86vh] min-h-[720px]'
            : 'max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800 overflow-hidden h-[88vh] min-h-[720px]'
        } bg-white flex flex-col relative`}
      >
        {/* Mobile Status Notch for Mobile Frame Mode */}
        {isMobileFrameView && (
          <div className="w-full bg-slate-900 text-slate-400 px-6 py-1 flex items-center justify-between text-[11px] font-mono z-40 shrink-0">
            <span>9:41 AM</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto"></div>
            <span>5G • 100%</span>
          </div>
        )}

        {/* Application Top Bar & Filter Bar - ONLY shown in Discovery Mode (hidden during active navigation to keep map clear) */}
        {!navigationState.isActive && (
          <>
            <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-amber-400">
                  BREWBOUND
                </span>
                <span className="text-[10px] text-slate-400 font-medium border-l border-slate-700 pl-2">
                  Calamba Cafe Discovery
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-[11px]">
                  {filters.barangay === 'all' ? 'Poblacion 1–7' : `Brgy ${filters.barangay}`}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar Component */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              resultCount={filteredShops.length}
            />
          </>
        )}

        {/* Center Main Stage Area (Map + List Split or 100% Full-Screen Navigation View) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full h-full">
          
          {/* Map Surface (Active across Home, Search, & Live Navigation) */}
          <div className="flex-1 w-full h-full relative min-h-[300px]">
            <MapView
              coffeeShops={filteredShops}
              selectedShop={selectedShop}
              onSelectShop={(shop) => setSelectedShop(shop)}
              userLocation={userLocation}
              navigationState={navigationState}
              onUpdateUserLocation={(newLoc) => {
                setUserLocation(newLoc);
                if (navigationState.isActive && navigationState.originLocation.name.includes('GPS')) {
                  handleChangeOrigin(newLoc);
                }
              }}
            />

            {/* Live Navigation Overlay (Clean floating HUD over full map) */}
            {navigationState.isActive && (
              <NavigationView
                navigationState={navigationState}
                onCancelNavigation={handleCancelNavigation}
                onChangeTravelMode={handleChangeTravelMode}
                onChangeOrigin={handleChangeOrigin}
              />
            )}
          </div>

          {/* Side or Bottom Panel for Coffee Shop Cards (Hidden when navigating) */}
          {!navigationState.isActive && (
            <div
              className={`bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col z-10 transition-all ${
                isMobileFrameView
                  ? 'h-[44%] overflow-y-auto'
                  : 'w-full md:w-80 lg:w-96 max-h-full overflow-y-auto'
              }`}
            >
              {/* Panel Header */}
              <div className="sticky top-0 bg-slate-50/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-200 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    {activeTab === 'favorites'
                      ? `Saved Favorites (${filteredShops.length})`
                      : `Nearby Verified Cafes (${filteredShops.length})`}
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Poblacion 1-7
                </span>
              </div>

              {/* Cards List */}
              <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
                {filteredShops.length > 0 ? (
                  filteredShops.map((shop) => (
                    <CoffeeCard
                      key={shop.id}
                      shop={shop}
                      isSelected={selectedShop?.id === shop.id}
                      isFavorite={favorites.includes(shop.id)}
                      onSelect={(s) => setSelectedShop(s)}
                      onToggleFavorite={handleToggleFavorite}
                      onDirectNavigate={(e, s) => {
                        e.stopPropagation();
                        handleStartNavigation(s);
                      }}
                    />
                  ))
                ) : (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <Coffee className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-bold text-slate-600">
                      No coffee shops found matching criteria
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                      Try resetting filters or expanding barangay search in Calamba.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-amber-700 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar (Home / Search / Favorites) - Hidden when navigating */}
        {!navigationState.isActive && (
          <BottomNav
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'home') handleResetFilters();
            }}
            favoritesCount={validFavorites.length}
          />
        )}

        {/* Modal: Full Coffee Shop Details (Wireframe 2 Matched) */}
        {selectedShop && !navigationState.isActive && (
          <CoffeeDetailsModal
            shop={selectedShop}
            isFavorite={favorites.includes(selectedShop.id)}
            onClose={() => setSelectedShop(null)}
            onToggleFavorite={(shopId) => handleToggleFavorite(null, shopId)}
            onStartNavigation={handleStartNavigation}
          />
        )}

        {/* Modal: ISO/IEC 25010:2011 Software Evaluation Form & Stats */}
        {showIsoModal && (
          <IsoEvaluationModal onClose={() => setShowIsoModal(false)} />
        )}

        {/* Modal: Research Context & CCC Capstone Details */}
        {showResearchModal && (
          <ResearchInfoModal onClose={() => setShowResearchModal(false)} />
        )}
      </main>

      {/* Page Footer Note */}
      <footer className="mt-2 text-center text-[11px] text-slate-400">
        BREWBOUND © 2026 • City College of Calamba (BSIT Software Engineering 1) • Poblacion Barangays 1–7 Navigation & Management System
      </footer>
    </div>
  );
}

