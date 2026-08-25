import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { CoffeeShop } from '../types';
import { BARANGAYS_LIST } from '../data/calambaLandmarks';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Wifi,
  Zap,
  Snowflake,
  MapPin,
  Save,
  Download,
  RotateCcw,
  ShieldAlert,
  Crosshair,
  LocateFixed,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';

interface AdminManagerModalProps {
  coffeeShops: CoffeeShop[];
  onSaveShop: (shop: CoffeeShop) => void;
  onDeleteShop: (shopId: string) => void;
  onResetDefaultData: () => void;
  onClose: () => void;
}

// Preset Coordinates for Poblacion 1-7 for easy quick-snapping
const POBLACION_PRESETS = [
  { name: 'Brgy 1 (Near Plaza Rizal / Church)', lat: 14.2139, lng: 121.1662 },
  { name: 'Brgy 2 (Burgos / JP Rizal St)', lat: 14.2125, lng: 121.1645 },
  { name: 'Brgy 3 (Poblacion Market Area)', lat: 14.2152, lng: 121.1678 },
  { name: 'Brgy 4 (Chipeco Ave / National Hwy)', lat: 14.2088, lng: 121.1576 },
  { name: 'Brgy 5 (Real / Crossing Edge)', lat: 14.2115, lng: 121.1608 },
  { name: 'Brgy 6 (Poblacion Residential)', lat: 14.2168, lng: 121.1632 },
  { name: 'Brgy 7 (Lecheria Boundary)', lat: 14.2185, lng: 121.1595 },
];

export const AdminManagerModal: React.FC<AdminManagerModalProps> = ({
  coffeeShops,
  onSaveShop,
  onDeleteShop,
  onResetDefaultData,
  onClose,
}) => {
  const [editingShop, setEditingShop] = useState<CoffeeShop | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mini Map Pinning Tool state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [pinAddressPreview, setPinAddressPreview] = useState<string>('');
  const [isLocatingAdmin, setIsLocatingAdmin] = useState(false);

  const startCreateNew = () => {
    const newShop: CoffeeShop = {
      id: `cafe-${Date.now()}`,
      name: '',
      barangayId: 1,
      barangayName: 'Barangay 1',
      address: '',
      landmark: '',
      priceRange: '₱120 - ₱220',
      minPrice: 120,
      maxPrice: 220,
      openingTime: '08:00',
      closingTime: '22:00',
      operatingHoursText: '8:00 AM - 10:00 PM',
      daysOpen: 'Monday to Sunday',
      lat: 14.2135,
      lng: 121.1642,
      rating: 4.5,
      reviewCount: 1,
      verified: true,
      bannerImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      galleryImages: [],
      description: '',
      amenities: {
        wifiAvailable: true,
        wifiSpeedMbps: 45,
        wifiType: 'High Speed (Fiber)',
        wifiPasswordProvided: true,
        outletCount: 12,
        outletCoveragePercent: '80% of Tables',
        acAvailable: true,
        noiseLevel: 'Quiet / Study-Friendly',
        seatingCapacity: 30,
        parkingInfo: 'Street Parking',
        paymentMethods: ['Cash', 'GCash'],
        studyFriendlyScore: 5,
        verifiedDate: 'March 2026',
        verifiedBy: 'CCC BSIT Field Researcher',
      },
      menu: [
        { name: 'Signature Iced Coffee', price: 120, category: 'Coffee', popular: true }
      ],
      reviews: [],
    };
    setEditingShop(newShop);
    setIsCreating(true);
  };

  const handleStartEdit = (shop: CoffeeShop) => {
    setEditingShop({ ...shop });
    setIsCreating(false);
  };

  // Initialize and Update Leaflet Pinning Map inside Admin Form
  useEffect(() => {
    if (!editingShop || !mapContainerRef.current) return;

    // If map not yet created, instantiate Leaflet on OpenStreetMap
    if (!mapInstanceRef.current) {
      const initialLat = Number.isFinite(editingShop.lat) ? editingShop.lat : 14.2135;
      const initialLng = Number.isFinite(editingShop.lng) ? editingShop.lng : 121.1642;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      // Custom Draggable Pin Icon
      const pinIcon = L.divIcon({
        className: 'custom-admin-pin',
        html: `
          <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing group">
            <div class="px-2.5 py-1 rounded-full bg-amber-600 text-white font-extrabold text-[11px] shadow-2xl border-2 border-white ring-2 ring-amber-400 whitespace-nowrap flex items-center gap-1">
              <span>📍</span>
              <span>DRAG ME TO PIN CAFE</span>
            </div>
            <div class="w-3 h-3 bg-amber-600 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white"></div>
            <div class="w-2 h-2 bg-slate-900/40 rounded-full blur-[1px] mt-0.5"></div>
          </div>
        `,
        iconSize: [160, 42],
        iconAnchor: [80, 38],
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      // Listen for drag end to update coordinates
      marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        const roundedLat = parseFloat(position.lat.toFixed(6));
        const roundedLng = parseFloat(position.lng.toFixed(6));
        setEditingShop((prev) => (prev ? { ...prev, lat: roundedLat, lng: roundedLng } : null));
      });

      // Listen for click anywhere on map to instantly place pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickedLat = parseFloat(e.latlng.lat.toFixed(6));
        const clickedLng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng([clickedLat, clickedLng]);
        setEditingShop((prev) => (prev ? { ...prev, lat: clickedLat, lng: clickedLng } : null));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force recalculation of container size after mounting
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    } else {
      // Update marker position if coordinates change externally
      if (markerRef.current && Number.isFinite(editingShop.lat) && Number.isFinite(editingShop.lng)) {
        markerRef.current.setLatLng([editingShop.lat, editingShop.lng]);
        mapInstanceRef.current.panTo([editingShop.lat, editingShop.lng]);
      }
    }

    return () => {
      // Map cleanup on unmount of editing form
    };
  }, [editingShop?.id]);

  // Clean up map when editingShop becomes null
  useEffect(() => {
    if (!editingShop && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [editingShop]);

  // Geolocation quick button for Admin field surveys (stand at cafe and capture real GPS)
  const handleCaptureCurrentGps = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingAdmin(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingAdmin(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));

        setEditingShop((prev) => (prev ? { ...prev, lat, lng } : null));
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 18, { duration: 0.8 });
        }
      },
      (err) => {
        setIsLocatingAdmin(false);
        alert(`Could not capture device location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Preset snap
  const handleSnapPreset = (lat: number, lng: number) => {
    setEditingShop((prev) => (prev ? { ...prev, lat, lng } : null));
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 0.6 });
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !editingShop.name) return;

    const bgy = BARANGAYS_LIST.find((b) => b.id === editingShop.barangayId);
    const updated: CoffeeShop = {
      ...editingShop,
      barangayName: bgy ? bgy.shortName : `Barangay ${editingShop.barangayId}`,
      lat: Number(editingShop.lat) || 14.2135,
      lng: Number(editingShop.lng) || 121.1642,
    };

    onSaveShop(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditingShop(null);
      setIsCreating(false);
    }, 1200);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(coffeeShops, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `brewbound_calamba_dataset_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                Non-Client Information Management System
              </h2>
              <p className="text-xs text-slate-400">
                Poblacion Barangays 1 to 7 • Verified Amenity & Location Repository
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Methodological Context Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Non-Client-Based Architecture (CCC BSIT Capstone):</strong> Coffee shop owners are not required to maintain individual accounts. All data is gathered, speed-tested, and pinned directly on OpenStreetMap through field data collection by administrators/researchers to guarantee accurate amenity counts and precise navigation coordinates.
            </div>
          </div>

          {editingShop ? (
            /* Editing / Adding Form */
            <form onSubmit={handleSaveForm} className="space-y-5 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-600" />
                  {isCreating ? 'Add New Coffee Shop Record' : `Edit ${editingShop.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
              </div>

              {/* ----------------- INTERACTIVE MAP PINNING TOOL ----------------- */}
              <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span>Pin Exact Coffee Shop Location on OpenStreetMap</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Click anywhere on the map or drag the pin directly to the cafe's physical entrance in Calamba.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Capture Real GPS for Field Researchers */}
                    <button
                      type="button"
                      onClick={handleCaptureCurrentGps}
                      disabled={isLocatingAdmin}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-colors"
                      title="Use device GPS if standing directly at the cafe"
                    >
                      <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isLocatingAdmin ? 'Acquiring GPS...' : 'Use My Current GPS'}</span>
                    </button>
                  </div>
                </div>

                {/* Leaflet Interactive Mini-Map Container */}
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
                  <div ref={mapContainerRef} className="w-full h-full z-0" />
                  
                  {/* Floating Coordinates Badge */}
                  <div className="absolute bottom-2 left-2 z-10 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1 rounded-lg border border-slate-700 text-[11px] font-mono flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Lat: {editingShop.lat}</span>
                    <span>•</span>
                    <span>Lng: {editingShop.lng}</span>
                  </div>
                </div>

                {/* Quick Barangay Landmark Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700">Quick-Snap to Barangay Poblacion Center:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POBLACION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSnapPreset(preset.lat, preset.lng)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg text-[10px] font-medium text-slate-600 transition-colors"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Lat/Lng input fields */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingShop.lat}
                      onChange={(e) => {
                        const newLat = parseFloat(e.target.value) || 0;
                        setEditingShop({ ...editingShop, lat: newLat });
                        if (markerRef.current && mapInstanceRef.current) {
                          markerRef.current.setLatLng([newLat, editingShop.lng]);
                          mapInstanceRef.current.panTo([newLat, editingShop.lng]);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingShop.lng}
                      onChange={(e) => {
                        const newLng = parseFloat(e.target.value) || 0;
                        setEditingShop({ ...editingShop, lng: newLng });
                        if (markerRef.current && mapInstanceRef.current) {
                          markerRef.current.setLatLng([editingShop.lat, newLng]);
                          mapInstanceRef.current.panTo([editingShop.lat, newLng]);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ----------------- GENERAL SHOP DETAILS ----------------- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Establishment Name</label>
                  <input
                    type="text"
                    required
                    value={editingShop.name}
                    onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    placeholder="e.g. Grounded Cafe"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barangay (Poblacion 1-7)</label>
                  <select
                    value={editingShop.barangayId}
                    onChange={(e) => setEditingShop({ ...editingShop, barangayId: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  >
                    {BARANGAYS_LIST.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.landmark})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={editingShop.address}
                    onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. Burgos St. cor. JP Rizal St., Brgy 2, Calamba City"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nearby Landmark Reference</label>
                  <input
                    type="text"
                    value={editingShop.landmark}
                    onChange={(e) => setEditingShop({ ...editingShop, landmark: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. Beside Bureau of Internal Revenue (BIR)"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Range</label>
                  <input
                    type="text"
                    value={editingShop.priceRange}
                    onChange={(e) => setEditingShop({ ...editingShop, priceRange: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. ₱120 - ₱250"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={editingShop.operatingHoursText}
                    onChange={(e) => setEditingShop({ ...editingShop, operatingHoursText: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    placeholder="e.g. 8:00 AM - 10:00 PM"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rating (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingShop.rating}
                    onChange={(e) => setEditingShop({ ...editingShop, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                {/* Amenity Specs */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-blue-600" />
                    Wi-Fi Speed (Mbps)
                  </label>
                  <input
                    type="number"
                    value={editingShop.amenities.wifiSpeedMbps}
                    onChange={(e) =>
                      setEditingShop({
                        ...editingShop,
                        amenities: {
                          ...editingShop.amenities,
                          wifiSpeedMbps: Number(e.target.value),
                          wifiType: `Fiber Broadband (${e.target.value} Mbps)`,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    Outlet Socket Count
                  </label>
                  <input
                    type="number"
                    value={editingShop.amenities.outletCount}
                    onChange={(e) =>
                      setEditingShop({
                        ...editingShop,
                        amenities: {
                          ...editingShop.amenities,
                          outletCount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingShop.amenities.acAvailable}
                      onChange={(e) =>
                        setEditingShop({
                          ...editingShop,
                          amenities: {
                            ...editingShop.amenities,
                            acAvailable: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-amber-600 w-4 h-4"
                    />
                    <span>Air Conditioned</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingShop.verified}
                      onChange={(e) =>
                        setEditingShop({
                          ...editingShop,
                          verified: e.target.checked,
                        })
                      }
                      className="rounded accent-blue-600 w-4 h-4"
                    />
                    <span>Verified Badge</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Cafe Record & Pin</span>
                </button>
              </div>

              {saveSuccess && (
                <div className="text-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl animate-in fade-in">
                  ✓ Coffee shop database record and map pin saved successfully!
                </div>
              )}
            </form>
          ) : (
            /* Database Table View */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    All Registered Establishments ({coffeeShops.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={startCreateNew}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Cafe</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs border border-slate-300 transition-colors"
                    title="Export database as JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reset all coffee shops back to initial verified CCC research dataset?')) {
                        onResetDefaultData();
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold border border-rose-200 transition-colors"
                    title="Reset to initial data"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Table of Coffee Shops */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-3">Establishment</th>
                      <th className="p-3">Barangay</th>
                      <th className="p-3">Map Coordinates</th>
                      <th className="p-3">Wi-Fi & Outlets</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {coffeeShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{shop.name}</span>
                            {shop.verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {shop.landmark || shop.address}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {shop.barangayName}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">
                          📍 {shop.lat?.toFixed(4)}, {shop.lng?.toFixed(4)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              <Wifi className="w-3 h-3" /> {shop.amenities.wifiSpeedMbps}M
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              <Zap className="w-3 h-3" /> {shop.amenities.outletCount}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(shop)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Details & Re-pin Location"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${shop.name}"?`)) {
                                  onDeleteShop(shop.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete from Repository"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <span>Non-Client Field Data Collection & GPS Repository System</span>
          <span className="font-semibold text-slate-700">Poblacion Barangays 1–7</span>
        </div>
      </div>
    </div>
  );
};
