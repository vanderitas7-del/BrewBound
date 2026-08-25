import React, { useState, useEffect } from 'react';
import { CoffeeShop, LocationPoint, NavigationState } from '../types';
import { CALAMBA_LANDMARKS } from '../data/calambaLandmarks';
import {
  ArrowLeft,
  Navigation,
  Footprints,
  Car,
  Bike,
  Compass,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Clock,
  Milestone
} from 'lucide-react';

interface NavigationViewProps {
  navigationState: NavigationState;
  onCancelNavigation: () => void;
  onChangeTravelMode: (mode: 'walking' | 'tricycle' | 'driving') => void;
  onChangeOrigin: (origin: LocationPoint) => void;
}

export const NavigationView: React.FC<NavigationViewProps> = ({
  navigationState,
  onCancelNavigation,
  onChangeTravelMode,
  onChangeOrigin,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [arrived, setArrived] = useState(false);

  const destination = navigationState.destinationShop;

  // Auto-progress simulation
  useEffect(() => {
    if (arrived || !navigationState.steps.length) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < navigationState.steps.length - 1) {
          return prev + 1;
        } else {
          setArrived(true);
        }
        return prev;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [arrived, navigationState.steps.length]);

  if (!destination) return null;

  const currentStepData = navigationState.steps[currentStep] || navigationState.steps[0];

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top Floating Header HUD (Matching Wireframe 3: Back, Mode Switcher, Destination Info) */}
      <div className="pointer-events-auto w-full max-w-lg mx-auto bg-slate-900/90 backdrop-blur-md text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-slate-700/80 animate-in slide-in-from-top-3">
        <div className="flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            onClick={onCancelNavigation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs border border-slate-700 active:scale-95"
            title="Back to Discovery"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back</span>
          </button>

          {/* Destination & Origin Summary */}
          <div className="min-w-0 flex-1 px-1">
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-400 truncate">
              <span className="truncate">To: {destination.name}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-300">
              <span className="text-slate-400">From:</span>
              <select
                value={navigationState.originLocation.name}
                onChange={(e) => {
                  if (e.target.value === navigationState.originLocation.name) return;
                  const landmark = CALAMBA_LANDMARKS.find((l) => l.name === e.target.value);
                  if (landmark) onChangeOrigin(landmark);
                }}
                className="bg-slate-800/90 border border-slate-700 text-slate-200 text-[10px] font-medium rounded px-1.5 py-0.5 max-w-[130px] sm:max-w-[180px] truncate focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {/* Include live GPS option if active */}
                {!CALAMBA_LANDMARKS.some((l) => l.name === navigationState.originLocation.name) && (
                  <option value={navigationState.originLocation.name} className="bg-slate-900 text-amber-300 font-bold">
                    {navigationState.originLocation.name}
                  </option>
                )}
                {CALAMBA_LANDMARKS.map((lm) => (
                  <option key={lm.name} value={lm.name} className="bg-slate-900 text-white">
                    {lm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Travel Mode Toggle (Bus/Tricycle, Car, Walk - exact Wireframe 3 icons) */}
          <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-xl border border-slate-700 shrink-0">
            <button
              onClick={() => onChangeTravelMode('walking')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                navigationState.travelMode === 'walking'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Walking Mode"
            >
              <Footprints className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTravelMode('tricycle')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                navigationState.travelMode === 'tricycle'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Calamba Tricycle / Jeepney Mode"
            >
              <Bike className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTravelMode('driving')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                navigationState.travelMode === 'driving'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Car / Motorbike Mode"
            >
              <Car className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Center Route Status (Subtle, transparent, minimal) */}
      <div className="pointer-events-none self-center bg-slate-900/75 backdrop-blur-md text-amber-300 text-[10px] font-mono font-medium px-3 py-1 rounded-full shadow-md border border-slate-700/60 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>&lt;&lt; OpenStreetMap Live Routing &gt;&gt;</span>
      </div>

      {/* Bottom Floating Direction Card (Exact Wireframe 3: Direction Card, Distance, ETA, Cancel Button) */}
      <div className="pointer-events-auto w-full max-w-lg mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-200/90 animate-in slide-in-from-bottom-3 space-y-2.5">
        
        {/* Step-by-Step Direction Instruction */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Navigation className="w-4 h-4 -rotate-45" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Compass className="w-3 h-3 text-blue-600" />
                <span>Step {currentStep + 1} of {navigationState.steps.length}</span>
              </div>
              <div className="font-extrabold text-xs text-slate-900 truncate">
                {arrived ? `You have arrived at ${destination.name}!` : currentStepData.instruction}
              </div>
            </div>
          </div>

          {/* Step Manual Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (currentStep < navigationState.steps.length - 1) {
                  setCurrentStep((prev) => prev + 1);
                } else {
                  setArrived(true);
                }
              }}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-0.5"
              title="Next Step"
            >
              <span>{arrived ? 'Arrived' : 'Next'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Distance & ETA Info Strip (Wireframe format: "Follow directions to Grounded Cafe. Distance: 1.8 km | ETA: 6 mins") */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <div className="text-slate-700 text-[11px] truncate flex items-center gap-1">
            <Milestone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Heading to <strong>{destination.name}</strong></span>
          </div>
          <div className="font-extrabold text-blue-800 text-xs shrink-0 whitespace-nowrap pl-2">
            {navigationState.totalDistanceKm} km • ~{navigationState.estimatedTimeMins} mins
          </div>
        </div>

        {/* Cancel Navigation Button (Exact Wireframe 3: Red button with red circle dot) */}
        <button
          onClick={onCancelNavigation}
          className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>
          <span>Cancel Navigation</span>
        </button>
      </div>
    </div>
  );
};
