import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { CoffeeShop, LocationPoint, NavigationState } from '../types';
import {
  Compass,
  LocateFixed,
  ZoomIn,
  ZoomOut,
  Layers,
  Check,
  Radio,
  AlertCircle,
  X
} from 'lucide-react';

interface MapViewProps {
  coffeeShops: CoffeeShop[];
  selectedShop: CoffeeShop | null;
  onSelectShop: (shop: CoffeeShop) => void;
  userLocation: LocationPoint;
  navigationState: NavigationState;
  onUpdateUserLocation: (loc: LocationPoint) => void;
}

// Convert route points safely to [lat, lng] array
function normalizeLatLngList(points: [number, number][] | any[]): [number, number][] {
  if (!points || !Array.isArray(points)) return [];
  return points
    .map((pt) => {
      if (!pt) return null;
      let lat: number, lng: number;
      if (Array.isArray(pt)) {
        lat = Number(pt[0]);
        lng = Number(pt[1]);
      } else {
        lat = Number((pt as any).lat);
        lng = Number((pt as any).lng);
      }
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lat, lng] as [number, number];
      }
      return null;
    })
    .filter((p): p is [number, number] => p !== null);
}

export const MapView: React.FC<MapViewProps> = ({
  coffeeShops,
  selectedShop,
  onSelectShop,
  userLocation,
  navigationState,
  onUpdateUserLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Default and Primary Map Style: OpenStreetMap (100% Free & Open-Source)
  const [mapLayerStyle, setMapLayerStyle] = useState<
    'osm-standard' | 'osm-humanitarian' | 'osm-cyclosm' | 'esri-satellite' | 'carto-dark'
  >('osm-standard');

  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Live GPS Tracking State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Safe normalized route points
  const safeRoutePoints = useMemo(() => {
    return normalizeLatLngList(navigationState.routePoints);
  }, [navigationState.routePoints]);

  // OpenStreetMap Tile Configuration (No API Keys, No Billing)
  const getTileConfig = (style: typeof mapLayerStyle) => {
    switch (style) {
      case 'osm-standard':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
          name: 'OpenStreetMap Standard',
        };
      case 'osm-humanitarian':
        return {
          url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors, Humanitarian OSM Team',
          name: 'OSM Humanitarian (HOT)',
        };
      case 'osm-cyclosm':
        return {
          url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
          maxZoom: 20,
          attribution: '© OpenStreetMap contributors, CyclOSM',
          name: 'CyclOSM (Walkways & Streets)',
        };
      case 'esri-satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
          attribution: '© Esri, Maxar, OpenStreetMap contributors',
          name: 'Satellite View (Aerial)',
        };
      case 'carto-dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          maxZoom: 20,
          attribution: '© OpenStreetMap contributors, CARTO',
          name: 'Dark Night Mode (OSM Data)',
        };
    }
  };

  // 1. Initialize Leaflet Map with OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    const config = getTileConfig(mapLayerStyle);
    const tileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: 'abc',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch OpenStreetMap Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const config = getTileConfig(mapLayerStyle);
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      subdomains: 'abc',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapLayerStyle]);

  // 3. Handle Responsive Resizing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [navigationState.isActive]);

  // 4. Update / Render User Pin & Live GPS Radar Marker + Accuracy Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activePoint = liveCoords || (navigationState.isActive ? navigationState.originLocation : userLocation);
    if (!activePoint || !Number.isFinite(activePoint.lat) || !Number.isFinite(activePoint.lng)) return;

    const isLiveGps = isGpsActive && liveCoords !== null;

    // Remove existing marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // High-Visibility Custom User Marker Icon
    const markerHtml = isLiveGps
      ? `
        <div class="relative flex items-center justify-center pointer-events-auto cursor-pointer group">
          <!-- Multi-stage Radar Pulse Ring -->
          <div class="absolute w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-30"></div>
          <div class="absolute w-8 h-8 bg-blue-400 rounded-full animate-pulse opacity-50"></div>
          <!-- Center Location Pin Dot -->
          <div class="relative w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-2xl flex items-center justify-center ring-4 ring-blue-400/40">
            <div class="w-2.5 h-2.5 bg-white rounded-full shadow-inner animate-pulse"></div>
          </div>
          <!-- Live Location Tooltip Banner -->
          <div class="absolute -top-8 whitespace-nowrap bg-blue-950 text-blue-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-lg border border-blue-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>YOU ARE HERE (LIVE GPS)</span>
          </div>
        </div>
      `
      : `
        <div class="relative flex items-center justify-center pointer-events-auto">
          <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-40"></div>
          <div class="relative w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div class="absolute -top-7 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-slate-700 pointer-events-none">
            ${userLocation.name.includes('CCC') ? 'City College of Calamba' : userLocation.name}
          </div>
        </div>
      `;

    const userIcon = L.divIcon({
      className: 'custom-live-user-marker',
      html: markerHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    userMarkerRef.current = L.marker([activePoint.lat, activePoint.lng], {
      icon: userIcon,
      zIndexOffset: 1200,
    }).addTo(map);

    // Draw GPS Accuracy Circle if Live GPS is active
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    if (isLiveGps && gpsAccuracy && gpsAccuracy > 0) {
      accuracyCircleRef.current = L.circle([activePoint.lat, activePoint.lng], {
        radius: Math.min(gpsAccuracy, 200), // Cap visual radius at 200m
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4',
      }).addTo(map);
    }
  }, [userLocation, liveCoords, isGpsActive, gpsAccuracy, navigationState.isActive, navigationState.originLocation]);

  // 5. Update Coffee Shop Markers & Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    // In Navigation Mode: Highlight Destination Pin
    if (navigationState.isActive && navigationState.destinationShop) {
      const dest = navigationState.destinationShop;
      if (Number.isFinite(dest.lat) && Number.isFinite(dest.lng)) {
        const destIcon = L.divIcon({
          className: 'custom-shop-marker',
          html: `
            <div class="relative flex flex-col items-center">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white shadow-2xl border-2 border-white ring-2 ring-red-400">
                <span class="text-xs">🏁</span>
                <span class="text-xs font-extrabold tracking-tight">${dest.name}</span>
              </div>
              <div class="w-3 h-3 bg-red-600 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white"></div>
            </div>
          `,
          iconSize: [140, 42],
          iconAnchor: [70, 38],
        });

        destinationMarkerRef.current = L.marker([dest.lat, dest.lng], {
          icon: destIcon,
          zIndexOffset: 1100,
        }).addTo(map);
      }
      return;
    }

    // Discovery Mode: Show All Verified Coffee Shop Pins
    coffeeShops.forEach((shop) => {
      if (!Number.isFinite(shop.lat) || !Number.isFinite(shop.lng)) return;
      const isSelected = selectedShop?.id === shop.id;

      const shopIcon = L.divIcon({
        className: 'custom-shop-marker',
        html: `
          <div class="relative group cursor-pointer transition-transform duration-200 hover:scale-110 ${
            isSelected ? 'scale-125 z-50' : 'z-20'
          }">
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border ${
              isSelected
                ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300'
                : 'bg-white text-slate-800 border-amber-200 hover:border-amber-400'
            }">
              <span class="text-xs">☕</span>
              <span class="text-[11px] font-bold tracking-tight truncate max-w-[85px]">${
                shop.name
              }</span>
              <span class="text-[10px] ${
                isSelected ? 'text-amber-100 font-semibold' : 'text-amber-700 font-semibold'
              }">${shop.rating}★</span>
            </div>
            <div class="w-2 h-2 bg-amber-600 rotate-45 mx-auto -mt-1 shadow-sm"></div>
          </div>
        `,
        iconSize: [110, 34],
        iconAnchor: [55, 30],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon: shopIcon });
      marker.on('click', () => {
        onSelectShop(shop);
      });

      markersLayer.addLayer(marker);
    });
  }, [coffeeShops, selectedShop, onSelectShop, navigationState.isActive, navigationState.destinationShop]);

  // 6. Update Route Polyline & Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (navigationState.isActive && safeRoutePoints.length > 1) {
      // Draw OpenStreetMap route polyline
      const polyline = L.polyline(safeRoutePoints, {
        color: '#2563eb', // Blue-600
        weight: 6,
        opacity: 0.95,
        dashArray: navigationState.travelMode === 'walking' ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Fit bounds safely
      try {
        const bounds = L.latLngBounds(safeRoutePoints);
        if (bounds.isValid()) {
          setTimeout(() => {
            map.invalidateSize();
            map.fitBounds(bounds, {
              paddingTopLeft: [40, 90],
              paddingBottomRight: [40, 160],
              maxZoom: 17,
              animate: true,
            });
          }, 80);
        }
      } catch (err) {
        console.warn('Map bounds calculation warning:', err);
      }
    } else if (selectedShop && Number.isFinite(selectedShop.lat) && Number.isFinite(selectedShop.lng)) {
      map.flyTo([selectedShop.lat, selectedShop.lng], 17, {
        duration: 0.8,
      });
    }
  }, [navigationState.isActive, safeRoutePoints, selectedShop, navigationState.travelMode]);

  // Real-Time Live GPS Trigger & Continuous Watch
  const handleToggleGPS = useCallback(() => {
    setGpsError(null);

    if (isLocating) return;

    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    // 1. Initial Immediate Fix
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);

        const newLoc: LocationPoint = {
          lat,
          lng,
          name: '📍 My Live GPS Location',
        };

        setLiveCoords({ lat, lng });
        setGpsAccuracy(accuracy);
        setIsGpsActive(true);
        setIsLocating(false);

        // Update application state so distances and routes update
        onUpdateUserLocation(newLoc);

        // Fly map smoothly to the user's live position
        mapInstanceRef.current?.flyTo([lat, lng], 17, {
          duration: 1.0,
        });

        // 2. Start Continuous Real-Time GPS Watching
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            const wLat = watchPos.coords.latitude;
            const wLng = watchPos.coords.longitude;
            const wAcc = Math.round(watchPos.coords.accuracy || 10);

            setLiveCoords({ lat: wLat, lng: wLng });
            setGpsAccuracy(wAcc);

            const updatedLoc: LocationPoint = {
              lat: wLat,
              lng: wLng,
              name: '📍 My Live GPS Location',
            };
            onUpdateUserLocation(updatedLoc);
          },
          (watchErr) => {
            console.warn('WatchPosition error:', watchErr);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
          }
        );
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        let errorText = 'Unable to retrieve your location.';
        if (err.code === err.PERMISSION_DENIED) {
          errorText = 'Location permission was denied. Please allow location access in your browser.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorText = 'GPS signal unavailable. Please ensure location services are turned on.';
        } else if (err.code === err.TIMEOUT) {
          errorText = 'Location request timed out. Retrying...';
        }
        setGpsError(errorText);

        mapInstanceRef.current?.flyTo([userLocation.lat, userLocation.lng], 16);
      },
      geoOptions
    );
  }, [isLocating, onUpdateUserLocation, userLocation]);

  // Center / Recenter to Active Location or Route
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      if (navigationState.isActive && safeRoutePoints.length > 1) {
        const bounds = L.latLngBounds(safeRoutePoints);
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, {
            paddingTopLeft: [40, 90],
            paddingBottomRight: [40, 160],
          });
        }
      } else {
        const target = liveCoords || userLocation;
        mapInstanceRef.current.flyTo([target.lat, target.lng], 17, {
          duration: 0.6,
        });
      }
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const currentConfig = getTileConfig(mapLayerStyle);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-slate-100 flex-1">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Live GPS Active Floating Banner (Top Center) */}
      {isGpsActive && liveCoords && !navigationState.isActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in slide-in-from-top-2">
          <div className="bg-blue-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl border border-blue-400/60 flex items-center gap-2 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-[11px] text-blue-100">
              Live GPS Pin Active {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
            </span>
            <button
              onClick={handleRecenter}
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-extrabold rounded-full transition-colors ml-1"
            >
              Center
            </button>
          </div>
        </div>
      )}

      {/* GPS Error Notification Popover */}
      {gpsError && (
        <div className="absolute top-3 left-4 right-4 sm:left-auto sm:right-14 z-30 max-w-sm bg-rose-900/95 text-white p-3 rounded-2xl shadow-2xl border border-rose-500/80 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-rose-100">Location Notice</div>
              <div className="text-[11px] text-rose-200 mt-0.5 leading-tight">{gpsError}</div>
            </div>
            <button
              onClick={() => setGpsError(null)}
              className="p-1 text-rose-300 hover:text-white rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Left Status Badge in Discovery Mode */}
      {!navigationState.isActive && !isGpsActive && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none hidden sm:block">
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-semibold text-slate-700">
              OpenStreetMap • Calamba Poblacion 1–7
            </span>
          </div>
        </div>
      )}

      {/* Floating Control Buttons */}
      <div
        className={`absolute ${
          navigationState.isActive ? 'top-20' : 'top-3'
        } right-3 z-20 flex flex-col gap-1.5 transition-all`}
      >
        {/* GPS Live Location Button with Pulse Indicator */}
        <button
          onClick={handleToggleGPS}
          disabled={isLocating}
          title={
            isGpsActive
              ? 'GPS Active - Click to Re-center Pin'
              : 'Find My Live Device GPS Location'
          }
          className={`p-2.5 rounded-xl shadow-lg border transition-all relative ${
            isGpsActive
              ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-300 shadow-blue-500/30'
              : isLocating
              ? 'bg-amber-500 text-white border-amber-400 animate-pulse'
              : 'bg-white/95 backdrop-blur-md text-slate-700 hover:text-blue-600 hover:bg-white border-slate-200'
          }`}
        >
          {isLocating ? (
            <Radio className="w-4 h-4 animate-spin text-white" />
          ) : (
            <LocateFixed className={`w-4 h-4 ${isGpsActive ? 'text-white' : ''}`} />
          )}
          {isGpsActive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          )}
        </button>

        {/* Recenter Map Button */}
        <button
          onClick={handleRecenter}
          title="Fit Route / Re-Center"
          className="p-2.5 bg-white/90 backdrop-blur-md text-slate-700 hover:text-amber-600 rounded-xl shadow-md border border-slate-200 hover:bg-white transition-colors"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Map Tile Style Switcher Button */}
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          title="Switch OpenStreetMap Layer Style"
          className="p-2.5 bg-white/90 backdrop-blur-md text-slate-700 hover:text-emerald-600 rounded-xl shadow-md border border-slate-200 hover:bg-white transition-colors"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-xl overflow-hidden shadow-md border border-slate-200 bg-white/90 backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 text-slate-700 hover:bg-white transition-colors border-b border-slate-200"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 text-slate-700 hover:bg-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Free OpenStreetMap Style Layer Picker (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/85 hover:bg-slate-900 text-slate-200 text-[10px] font-medium rounded-lg backdrop-blur-md border border-slate-700 shadow-md transition-colors"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isGpsActive ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`}></span>
          <span>{isGpsActive ? '📍 GPS Live (OSM)' : currentConfig.name}</span>
          <span className="text-[9px] text-amber-300 font-semibold bg-slate-800 px-1 rounded">OSM</span>
        </button>
      </div>

      {/* Map Provider Selector Modal */}
      {showLayerMenu && (
        <div className="absolute bottom-10 left-2 z-40 w-68 bg-white rounded-2xl shadow-2xl border border-slate-300 p-3 text-xs animate-in slide-in-from-bottom-2">
          <div className="font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>OpenStreetMap Styles (Free & Open)</span>
            </span>
            <button
              onClick={() => setShowLayerMenu(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            {[
              { id: 'osm-standard', label: 'OpenStreetMap Standard', desc: 'Official worldwide community map', icon: '🗺️' },
              { id: 'osm-humanitarian', label: 'OSM Humanitarian (HOT)', desc: 'High-contrast community street view', icon: '🏥' },
              { id: 'osm-cyclosm', label: 'CyclOSM Walk & Ride', desc: 'Shows pedestrian paths and streets', icon: '🚲' },
              { id: 'esri-satellite', label: 'Esri Satellite + OSM', desc: 'High-resolution aerial satellite imagery', icon: '🛰️' },
              { id: 'carto-dark', label: 'Dark Mode (OSM Tiles)', desc: 'Night view for evening coffee studies', icon: '🌙' },
            ].map((layer) => {
              const isActive = mapLayerStyle === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => {
                    setMapLayerStyle(layer.id as any);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-amber-50 border border-amber-300 text-amber-950 font-bold'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{layer.icon}</span>
                    <div>
                      <div className="text-[11px] font-bold leading-tight">{layer.label}</div>
                      <div className="text-[9px] text-slate-500">{layer.desc}</div>
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
