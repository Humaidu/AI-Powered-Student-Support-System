import React from "react";

interface PublicFooterProps {
  setActiveTab: (tab: string) => void;
  onOpenApply: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  setActiveTab,
  onOpenApply,
}) => {
  return (
    <footer className="bg-[#0b1c30] text-white border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="Hypervisor Logo"
                className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-white/20"
              />
              <div>
                <span className="font-headline font-bold text-xl tracking-tight block leading-none">
                  Hypervisor
                </span>
                <span className="text-[10px] text-slate-300 tracking-wider uppercase font-medium block mt-0.5">
                  Educational Complex • Ghana
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              Ghana's premier online technology education institution delivering
              industry-accredited diploma and certification programmes designed
              for the global digital economy.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Accra, Ghana Campus & Virtual Labs</span>
              </div>
            </div>
          </div>

          {/* Col 2: Programmes */}
          <div>
            <h4 className="font-headline font-bold text-sm text-white mb-4 uppercase tracking-wider">
              Programmes
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => setActiveTab("programmes")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Diploma in IT
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("programmes")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Cloud Computing
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("programmes")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Web Development
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("programmes")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  DevOps Engineering
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("programmes")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Cyber Security
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("programmes")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Digital Marketing
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation & Admissions */}
          <div>
            <h4 className="font-headline font-bold text-sm text-white mb-4 uppercase tracking-wider">
              Admissions
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  onClick={() => setActiveTab("admissions")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Admission Process
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("admissions")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Tuition & Payment Plans
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenApply}
                  className="hover:text-white font-semibold text-[#60a5fa] transition-colors cursor-pointer"
                >
                  Apply Online
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("about")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Leadership & Founders
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("contact")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Admissions
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact details */}
          <div>
            <h4 className="font-headline font-bold text-sm text-white mb-4 uppercase tracking-wider">
              Accra Campus
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-[#60a5fa] shrink-0">
                  location_on
                </span>
                <span>
                  Airport Residential Area, Independence Ave, Accra, Ghana
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#60a5fa] shrink-0">
                  mail
                </span>
                <span>admissions@hypervisor.edu.gh</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#60a5fa] shrink-0">
                  call
                </span>
                <span>+233 (0) 30 298 4500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            © 2026 Hypervisor Educational Complex. All rights reserved. Accra,
            Ghana.
          </p>

          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Student Regulations
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
