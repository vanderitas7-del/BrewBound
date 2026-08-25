import React from 'react';
import {
  GraduationCap,
  BookOpen,
  MapPin,
  CheckCircle2,
  Users,
  Building,
  Sparkles,
  X,
  FileText
} from 'lucide-react';

interface ResearchInfoModalProps {
  onClose: () => void;
}

export const ResearchInfoModal: React.FC<ResearchInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                Academic Research & Capstone Project
              </span>
              <h2 className="font-extrabold text-base tracking-tight text-white">
                City College of Calamba
              </h2>
              <p className="text-[11px] text-slate-300">
                Department of Computing and Informatics • BSIT
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Study Title Box */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200">
            <h3 className="font-extrabold text-sm text-slate-900 leading-snug tracking-tight mb-2">
              BREWBOUND: A WEB-BASED APPLICATION FOR NAVIGATION AND INFORMATION MANAGEMENT SYSTEM FOR SELECTED BARANGAYS IN CALAMBA
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              A Software Engineering project addressing the growing need for granular, verified coffee shop amenity discovery (Wi-Fi bandwidth, charging sockets, AC, and turn-by-turn routing) across <strong>Poblacion Barangays 1 through 7</strong> in Calamba City, Laguna.
            </p>
          </div>

          {/* Research Authors */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Research Authors & Developers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block text-xs">
                  FIRME, EAVAN C.
                </span>
                <span className="text-[10px] text-slate-500">BSIT Researcher</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block text-xs">
                  LUCIO, ELVIS JOSHUA L.
                </span>
                <span className="text-[10px] text-slate-500">BSIT Researcher</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block text-xs">
                  PAMPLONA, JOHN REIN M.
                </span>
                <span className="text-[10px] text-slate-500">BSIT Researcher</span>
              </div>
            </div>
          </div>

          {/* Research Objectives & Methodology */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Research Specific Objectives
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>1. User-Friendly Interface:</strong> Design a mobile web interface for exploring verified coffee shops in Poblacion 1–7.
                </span>
              </li>
              <li className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>2. Location-Based Navigation:</strong> Accurate OpenStreetMap turn-by-turn routing with distance and ETA calculation.
                </span>
              </li>
              <li className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>3. Granular Amenity Data:</strong> Verified Wi-Fi speed (Mbps), dedicated power outlet counts, and AC status.
                </span>
              </li>
              <li className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>4. Non-Client Architecture:</strong> System functions without requiring continuous owner administration.
                </span>
              </li>
              <li className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>5. ISO/IEC 25010:2011 Evaluation:</strong> Assessment across Functional Suitability, Performance Efficiency, Reliability, and Usability.
                </span>
              </li>
            </ul>
          </div>

          {/* Research Locale Info */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Research Locale: Poblacion Barangays 1 to 7, Calamba City, Laguna
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Surrounding City College of Calamba, Jose Rizal Shrine, Plaza Calamba, and St. John the Baptist Parish Church.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Bachelor of Science in Information Technology • 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
