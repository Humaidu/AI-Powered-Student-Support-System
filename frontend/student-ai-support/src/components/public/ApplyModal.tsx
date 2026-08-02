import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROGRAMMES } from "../../data/websiteData";
import { ApplicationFormData } from "../../types/website";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProgrammeId?: string;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  isOpen,
  onClose,
  defaultProgrammeId,
}) => {
  const navigate = useNavigate();
  const [programmeId, setProgrammeId] = useState(
    defaultProgrammeId || PROGRAMMES[0].id,
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [highestQualification, setHighestQualification] = useState(
    "WASSCE / SHS Certificate",
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    // Option A: Store application data in localStorage and redirect to /register
    const applicationData: ApplicationFormData = {
      fullName,
      email,
      phone,
      programmeId,
      highestQualification,
      startDate: new Date().toISOString(),
    };

    // Save to localStorage so RegisterPage can pre-fill
    localStorage.setItem("pendingApplication", JSON.stringify(applicationData));

    // Redirect to registration page
    onClose();
    navigate("/register", {
      state: { fromApplication: true, applicationData },
    });
  };

  const selectedProgramme =
    PROGRAMMES.find((p) => p.id === programmeId) || PROGRAMMES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#c2c7d1] overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#0b1c30] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Hypervisor Logo"
              className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-white/20"
            />
            <div>
              <h3 className="font-headline text-lg font-bold">
                Apply for Admission
              </h3>
              <p className="text-xs text-slate-300">
                Hypervisor Educational Complex • Accra, Ghana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          <div className="p-4 bg-[#eff4ff] border border-[#bbd3fd] rounded-xl text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#0f4c81] text-xl shrink-0">
                info
              </span>
              <div className="text-xs text-[#0b1c30]">
                <p className="font-bold mb-1">Application Process</p>
                <p className="text-slate-600">
                  Complete this form to begin your application. You'll be
                  redirected to create your student account and finalize your
                  enrollment.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
              Select Programme of Interest
            </label>
            <select
              value={programmeId}
              onChange={(e) => setProgrammeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm font-medium text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
            >
              {PROGRAMMES.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.title} ({prog.duration})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-[#f8f9ff] border border-[#bbd3fd] rounded-xl flex items-center gap-3 text-xs text-[#0f4c81]">
            <span className="material-symbols-outlined text-lg shrink-0">
              info
            </span>
            <div>
              <p className="font-semibold">{selectedProgramme.title}</p>
              <p className="text-slate-600">
                Level: {selectedProgramme.level} • Tuition:{" "}
                {selectedProgramme.tuitionFee}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kwame Mensah"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="kwame@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+233 24 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
              Highest Qualification
            </label>
            <select
              value={highestQualification}
              onChange={(e) => setHighestQualification(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
            >
              <option value="WASSCE / SHS Certificate">
                WASSCE / SSSCE / SHS Certificate
              </option>
              <option value="Bachelor's Degree">Bachelor's Degree</option>
              <option value="HND / Higher National Diploma">
                HND / Higher National Diploma
              </option>
              <option value="Professional Diploma">Professional Diploma</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#c2c7d1] rounded-xl text-xs font-bold text-[#42474f] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f4c81] hover:bg-[#00355f] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Continue to Registration</span>
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
