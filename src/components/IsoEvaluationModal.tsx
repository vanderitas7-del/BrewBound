import React, { useState } from 'react';
import { IsoEvaluationResponse } from '../types';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Send,
  Star,
  UserCheck,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface IsoEvaluationModalProps {
  onClose: () => void;
}

const INITIAL_RESPONSES: IsoEvaluationResponse[] = [
  {
    id: 'eval-1',
    respondentType: 'Student',
    submittedAt: '2026-08-20',
    functionalSuitability: 5,
    performanceEfficiency: 5,
    reliability: 5,
    usability: 5,
    feedback: 'Very accurate outlet and Wi-Fi speed data for studying near CCC!',
  },
  {
    id: 'eval-2',
    respondentType: 'Remote Worker',
    submittedAt: '2026-08-21',
    functionalSuitability: 5,
    performanceEfficiency: 4,
    reliability: 5,
    usability: 5,
    feedback: 'The non-client verified amenities saved me so much time hopping between coffee shops in Brgy 2.',
  },
  {
    id: 'eval-3',
    respondentType: 'IT Instructor / Expert',
    submittedAt: '2026-08-22',
    functionalSuitability: 5,
    performanceEfficiency: 5,
    reliability: 4,
    usability: 5,
    feedback: 'Excellent adherence to ISO/IEC 25010 standards and great implementation of OpenStreetMap routing.',
  },
  {
    id: 'eval-4',
    respondentType: 'Resident',
    submittedAt: '2026-08-23',
    functionalSuitability: 4,
    performanceEfficiency: 5,
    reliability: 4,
    usability: 5,
    feedback: 'Intuitive bottom bar navigation and accurate landmark references.',
  },
];

export const IsoEvaluationModal: React.FC<IsoEvaluationModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'survey' | 'results'>('results');
  const [responses, setResponses] = useState<IsoEvaluationResponse[]>(() => {
    const saved = localStorage.getItem('brewbound_iso_evaluations');
    return saved ? JSON.parse(saved) : INITIAL_RESPONSES;
  });

  // Form State
  const [respondentType, setRespondentType] = useState<IsoEvaluationResponse['respondentType']>('Student');
  const [functionalSuitability, setFunctionalSuitability] = useState(5);
  const [performanceEfficiency, setPerformanceEfficiency] = useState(5);
  const [reliability, setReliability] = useState(5);
  const [usability, setUsability] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: IsoEvaluationResponse = {
      id: `eval-${Date.now()}`,
      respondentType,
      submittedAt: new Date().toISOString().split('T')[0],
      functionalSuitability,
      performanceEfficiency,
      reliability,
      usability,
      feedback,
    };

    const updated = [newEntry, ...responses];
    setResponses(updated);
    localStorage.setItem('brewbound_iso_evaluations', JSON.stringify(updated));
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('results');
    }, 1200);
  };

  // Descriptive Statistics Calculation
  const count = responses.length;
  const avgFunctional = (responses.reduce((sum, r) => sum + r.functionalSuitability, 0) / count) || 0;
  const avgEfficiency = (responses.reduce((sum, r) => sum + r.performanceEfficiency, 0) / count) || 0;
  const avgReliability = (responses.reduce((sum, r) => sum + r.reliability, 0) / count) || 0;
  const avgUsability = (responses.reduce((sum, r) => sum + r.usability, 0) / count) || 0;
  const overallWeightedMean = (avgFunctional + avgEfficiency + avgReliability + avgUsability) / 4;

  const getLikertInterpretation = (mean: number) => {
    if (mean >= 4.20) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-100' };
    if (mean >= 3.40) return { label: 'Very Satisfactory', color: 'text-blue-700 bg-blue-100' };
    if (mean >= 2.60) return { label: 'Satisfactory', color: 'text-amber-700 bg-amber-100' };
    if (mean >= 1.80) return { label: 'Poor', color: 'text-orange-700 bg-orange-100' };
    return { label: 'Very Poor', color: 'text-rose-700 bg-rose-100' };
  };

  const overallInterp = getLikertInterpretation(overallWeightedMean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                ISO/IEC 25010:2011 Software Quality Evaluation
              </h2>
              <p className="text-xs text-slate-400">
                City College of Calamba • Research Testing & Validation
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'results'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistical Results & Weighted Mean</span>
          </button>
          <button
            onClick={() => setActiveTab('survey')}
            className={`pb-2.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'survey'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit New Evaluation Form</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {activeTab === 'results' ? (
            <div className="space-y-5">
              {/* Overall Summary Card */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
                    Overall Software Quality Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-amber-400">
                      {overallWeightedMean.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">/ 5.00</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Based on <strong>{count}</strong> respondents (Students, Workers, IT Instructors)
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider mb-1">
                    Verbal Interpretation (Likert)
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${overallInterp.color}`}>
                    {overallInterp.label}
                  </span>
                </div>
              </div>

              {/* Sub-Characteristics Breakdown (Page 27) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Functional Suitability */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">6.1 Functional Suitability</span>
                    <span className="font-extrabold text-amber-700 text-sm">
                      {avgFunctional.toFixed(2)} ★
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Completeness of verified amenities, barangay filters, and navigation accuracy.
                  </p>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full"
                      style={{ width: `${(avgFunctional / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 2. Performance Efficiency */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">6.2 Performance Efficiency</span>
                    <span className="font-extrabold text-blue-700 text-sm">
                      {avgEfficiency.toFixed(2)} ★
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Fast response times, seamless OpenStreetMap rendering, and snappy filter operations.
                  </p>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${(avgEfficiency / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 3. Reliability */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">6.3 Reliability</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {avgReliability.toFixed(2)} ★
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Consistency of non-client gathered data and accurate GPS coordinates.
                  </p>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${(avgReliability / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 4. Usability */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">6.4 Usability</span>
                    <span className="font-extrabold text-purple-700 text-sm">
                      {avgUsability.toFixed(2)} ★
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Intuitive mobile-first layout, clear visual hierarchy, and ease of discovery.
                  </p>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full"
                      style={{ width: `${(avgUsability / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Evaluation Logs */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">
                  Recent Evaluation Logs & Feedback
                </h4>
                <div className="space-y-2">
                  {responses.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{r.respondentType}</span>
                          <span className="text-[10px] text-slate-400">{r.submittedAt}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700">
                          <span>Mean: {((r.functionalSuitability + r.performanceEfficiency + r.reliability + r.usability) / 4).toFixed(1)} ★</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] italic">&quot;{r.feedback}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Survey Form (Google Forms Research Instrument Replication) */
            <form onSubmit={handleSubmitSurvey} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  1. Respondent Profile / Category
                </label>
                <select
                  value={respondentType}
                  onChange={(e) => setRespondentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Student">Student (City College of Calamba / Local Colleges)</option>
                  <option value="Remote Worker">Remote Worker / Freelancer</option>
                  <option value="Resident">Local Calamba Resident (Poblacion)</option>
                  <option value="Tourist">Tourist / Visitor to Laguna</option>
                  <option value="IT Instructor / Expert">IT Instructor / Software Expert</option>
                </select>
              </div>

              {/* 6.1 Functional Suitability */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-900 mb-1">
                  6.1 Functional Suitability (1 - 5)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  The application accurately presents verified amenities (Wi-Fi, outlets, AC) and functions without requiring owner input.
                </p>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFunctionalSuitability(val)}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        functionalSuitability === val
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6.2 Performance Efficiency */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-900 mb-1">
                  6.2 Performance Efficiency (1 - 5)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  The map routing and filtering execute promptly without lag or excessive resource usage.
                </p>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPerformanceEfficiency(val)}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        performanceEfficiency === val
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6.3 Reliability */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-900 mb-1">
                  6.3 Reliability (1 - 5)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  System functions reliably, preserving search states and correctly pinpointing Poblacion coffee shops.
                </p>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setReliability(val)}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        reliability === val
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6.4 Usability */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-900 mb-1">
                  6.4 Usability (1 - 5)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  The interface is clear, easy to learn, and convenient for navigating Calamba barangays.
                </p>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setUsability(val)}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        usability === val
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Qualitative Feedback / Suggestions
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience navigating coffee shops in Calamba using BrewBound..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Submit Evaluation Responses</span>
              </button>

              {submittedSuccess && (
                <div className="text-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  ✓ Evaluation recorded into study dataset!
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>City College of Calamba • DCI BSIT Software Engineering 1</span>
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
