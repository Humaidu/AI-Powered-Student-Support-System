import React, { useState } from "react";
import { PROGRAMMES } from "../../data/websiteData";
import { Programme } from "../../types/website";

interface ProgrammesPageProps {
  onOpenApply: (programmeId?: string) => void;
}

export const ProgrammesPage: React.FC<ProgrammesPageProps> = ({
  onOpenApply,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<
    "All" | "Diploma" | "Certification"
  >("All");
  const [detailProgramme, setDetailProgramme] = useState<Programme | null>(
    null,
  );

  const filteredProgrammes =
    selectedFilter === "All"
      ? PROGRAMMES
      : PROGRAMMES.filter((p) => p.category === selectedFilter);

  return (
    <div className="space-y-16 pb-16 pt-20">
      {/* Page Header */}
      <section className="bg-[#0b1c30] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#60a5fa] px-3.5 py-1.5 bg-white/5 rounded-full border border-white/10 inline-block">
            Academic Offerings
          </span>
          <h1 className="font-headline text-3xl sm:text-5xl font-extrabold tracking-tight">
            Programmes & Professional Certifications
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Industry-crafted curricula designed to equip you with practical
            engineering capabilities required by leading tech firms.
          </p>

          {/* Filter Pills */}
          <div className="pt-4 flex justify-center gap-2">
            {(["All", "Diploma", "Certification"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === filter
                    ? "bg-[#0f4c81] text-white shadow-sm"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {filter === "All" ? "All Programmes" : `${filter}s`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid of Programmes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProgrammes.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-2xl border border-[#c2c7d1] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#0f4c81] transition-all flex flex-col group"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={prog.image}
                  alt={prog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#0b1c30]/90 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {prog.category}
                </div>
                <div className="absolute bottom-3 right-3 bg-white/95 text-[#0b1c30] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {prog.duration}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-headline font-bold text-xl text-[#0b1c30] group-hover:text-[#0f4c81] transition-colors">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {prog.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Career Outcomes:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prog.careerOutcomes.map((co, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[10px] bg-[#eff4ff] text-[#00355f] px-2 py-0.5 rounded-md font-medium"
                        >
                          {co}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => setDetailProgramme(prog)}
                      className="text-xs font-bold text-[#0f4c81] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Syllabus Details</span>
                      <span className="material-symbols-outlined text-sm">
                        visibility
                      </span>
                    </button>
                    <button
                      onClick={() => onOpenApply(prog.id)}
                      className="px-4 py-2 bg-[#0f4c81] hover:bg-[#00355f] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Programme Syllabus Detail Modal */}
      {detailProgramme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#c2c7d1] overflow-hidden my-8">
            <div className="bg-[#0b1c30] text-white p-6 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold bg-[#0f4c81] px-2.5 py-0.5 rounded-full">
                  {detailProgramme.category} • {detailProgramme.duration}
                </span>
                <h3 className="font-headline text-2xl font-bold mt-2">
                  {detailProgramme.title}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Level: {detailProgramme.level}
                </p>
              </div>
              <button
                onClick={() => setDetailProgramme(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <h4 className="font-headline text-sm font-bold text-[#0b1c30] uppercase tracking-wider mb-1">
                  Overview
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {detailProgramme.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-[#f8f9ff] border border-[#c2c7d1] rounded-xl text-xs">
                  <span className="font-bold text-[#0b1c30] block">
                    Tuition Fee:
                  </span>
                  <span className="text-[#0f4c81] font-semibold">
                    {detailProgramme.tuitionFee}
                  </span>
                </div>
                <div className="p-3 bg-[#f8f9ff] border border-[#c2c7d1] rounded-xl text-xs">
                  <span className="font-bold text-[#0b1c30] block">
                    Prerequisites:
                  </span>
                  <span className="text-slate-600">
                    {detailProgramme.prerequisites}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-headline text-sm font-bold text-[#0b1c30] uppercase tracking-wider mb-2">
                  Curriculum Modules
                </h4>
                <div className="space-y-2">
                  {detailProgramme.modules.map((mod, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-3 bg-white border border-[#c2c7d1] rounded-xl text-xs font-medium text-[#0b1c30] flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#eff4ff] text-[#0f4c81] font-bold text-[11px] flex items-center justify-center shrink-0">
                        0{mIdx + 1}
                      </span>
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setDetailProgramme(null)}
                  className="px-5 py-2.5 border border-[#c2c7d1] text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const progId = detailProgramme.id;
                    setDetailProgramme(null);
                    onOpenApply(progId);
                  }}
                  className="px-6 py-2.5 bg-[#0f4c81] hover:bg-[#00355f] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Apply for {detailProgramme.title}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
