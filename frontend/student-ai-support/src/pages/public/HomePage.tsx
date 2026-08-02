import React from "react";
import { PROGRAMMES, HIGHLIGHTS, WHY_HYPERVISOR } from "../../data/websiteData";

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  onOpenApply: (programmeId?: string) => void;
  onOpenChat: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setActiveTab,
  onOpenApply,
  onOpenChat,
}) => {
  return (
    <div className="space-y-20 pb-16">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-[#0b1c30] text-white overflow-hidden pt-20">
        {/* Background Overlay Graphic */}
        <div className="absolute inset-0 z-0 opacity-25 bg-[radial-gradient(#0f4c81_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 animate-in fade-in slide-in-from-left-6 duration-700">
            <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Build Your Future in{" "}
              <span className="text-[#60a5fa]">Technology</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Hypervisor Educational Complex provides industry-focused diploma
              and professional certification programmes that prepare students
              for successful careers in today's digital economy.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setActiveTab("programmes")}
                className="px-7 py-3.5 bg-[#0f4c81] hover:bg-[#00355f] text-white font-bold text-sm rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Explore Programmes</span>
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </button>

              <button
                onClick={onOpenChat}
                className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2 backdrop-blur-xs"
              >
                <span className="material-symbols-outlined text-lg">
                  psychology
                </span>
                <span>Chat with AI Assistant</span>
              </button>
            </div>

            {/* Micro stats banner */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-white/10 text-left">
              <div>
                <p className="font-headline font-bold text-2xl text-white">
                  100%
                </p>
                <p className="text-xs text-slate-400">Practical Lab Focused</p>
              </div>
              <div>
                <p className="font-headline font-bold text-2xl text-[#60a5fa]">
                  6 Tracks
                </p>
                <p className="text-xs text-slate-400">
                  High-Demand Disciplines
                </p>
              </div>
              <div>
                <p className="font-headline font-bold text-2xl text-emerald-400">
                  24/7
                </p>
                <p className="text-xs text-slate-400">AI Academic Support</p>
              </div>
            </div>
          </div>

          {/* Right Image Feature Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
                alt="African students in technology lab in Accra Ghana"
                className="w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30] via-transparent to-transparent opacity-80"></div>

              {/* Floating Badge overlay */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 text-[#0b1c30] shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b1c30] text-white flex items-center justify-center shrink-0 font-bold">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold font-headline">
                      Accredited Diploma Programmes
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Hybrid & Online Learning • Accra, Ghana
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Institution Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30]">
            Why Students Choose Hypervisor
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Built from the ground up to empower ambitious African learners with
            market-ready technological capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HIGHLIGHTS.map((h, idx) => (
            <div
              key={idx}
              className="p-6 bg-white rounded-2xl border border-[#c2c7d1] shadow-xs hover:border-[#0f4c81] hover:shadow-md transition-all group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#0f4c81] flex items-center justify-center mb-4 group-hover:bg-[#0f4c81] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">
                  {h.icon}
                </span>
              </div>
              <h3 className="font-headline font-bold text-lg text-[#0b1c30] mb-2">
                {h.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {h.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Programmes (6 cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs uppercase font-bold text-[#0f4c81] tracking-wider">
              Career-Ready Curricula
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30] mt-1">
              Featured Programmes
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select an industry-aligned programme to jumpstart your career in
              technology.
            </p>
          </div>

          <button
            onClick={() => setActiveTab("programmes")}
            className="px-5 py-2.5 border border-[#c2c7d1] hover:border-[#0f4c81] text-[#0f4c81] font-bold text-xs rounded-xl hover:bg-[#eff4ff] transition-all cursor-pointer self-start md:self-auto flex items-center gap-1"
          >
            <span>View All Details</span>
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROGRAMMES.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-2xl border border-[#c2c7d1] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#0f4c81] transition-all flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden">
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
                      {prog.careerOutcomes.slice(0, 3).map((co, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[10px] bg-[#eff4ff] text-[#00355f] px-2 py-0.5 rounded-md font-medium"
                        >
                          {co}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setActiveTab("programmes")}
                      className="text-xs font-bold text-[#0f4c81] hover:underline cursor-pointer"
                    >
                      Learn More
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

      {/* 4. Why Hypervisor */}
      <section className="bg-[#eff4ff] py-16 border-y border-[#c2c7d1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-bold text-[#0f4c81] tracking-wider">
              Educational Excellence
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30] mt-1">
              Why Study at Hypervisor Educational Complex
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_HYPERVISOR.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0f4c81] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-base text-[#0b1c30]">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI Assistant Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0b1c30] to-[#0f4c81] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-xs">
              <span className="material-symbols-outlined text-base">
                psychology
              </span>
              <span>Interactive RAG AI Engine</span>
            </div>

            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold">
              Need Help? Ask Hypervisor AI
            </h2>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
              Have questions about entry requirements, tuition payment plans,
              course schedules, or student visas? Our intelligent AI Assistant
              provides instant, accurate answers based on official institutional
              policies.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={onOpenChat}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-[#0b1c30] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all transform hover:scale-105 cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>Open Chat Assistant</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative z-10">
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold border-b border-white/10 pb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sample Instant Inquiry:</span>
              </div>
              <p className="text-slate-200 italic">
                "What are the requirements for the Cloud Computing
                certification?"
              </p>
              <div className="p-3 bg-white/10 rounded-xl text-slate-100 space-y-1 text-[11px]">
                <p className="font-bold text-emerald-300">
                  Hypervisor AI Response:
                </p>
                <p>
                  The Cloud Computing certification requires basic networking
                  knowledge. It spans 6 months, featuring hands-on AWS & GCP
                  labs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
