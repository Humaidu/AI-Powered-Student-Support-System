import React, { useState } from "react";
import { FAQS } from "../../data/websiteData";

interface AdmissionsPageProps {
  onOpenApply: () => void;
}

export const AdmissionsPage: React.FC<AdmissionsPageProps> = ({
  onOpenApply,
}) => {
  const [activeFaqId, setActiveFaqId] = useState<string | null>(FAQS[0].id);

  const toggleFaq = (id: string) => {
    setActiveFaqId(activeFaqId === id ? null : id);
  };

  return (
    <div className="space-y-16 pb-16 pt-20">
      {/* Hero Header */}
      <section className="bg-[#0b1c30] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#60a5fa] px-3.5 py-1.5 bg-white/5 rounded-full border border-white/10 inline-block">
            Join Hypervisor Educational Complex
          </span>
          <h1 className="font-headline text-3xl sm:text-5xl font-extrabold tracking-tight">
            Admissions & Enrollment Process
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Simple, transparent, and accessible admission steps for all
            prospective students across West Africa and internationally.
          </p>
        </div>
      </section>

      {/* 4 Application Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold text-[#0f4c81] tracking-wider">
            Step-by-Step Pathway
          </span>
          <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30] mt-1">
            How to Apply in 4 Simple Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Select Programme",
              desc: "Browse our accredited diploma and certification tracks and choose the course aligning with your career goals.",
            },
            {
              step: "02",
              title: "Submit Online Application",
              desc: "Fill out our online application form with your legal name, contact details, and academic qualifications.",
            },
            {
              step: "03",
              title: "Document Review",
              desc: "Our Admissions Committee reviews your submission within 48 hours and issues an official Admission Offer Letter.",
            },
            {
              step: "04",
              title: "Enrollment & orientation",
              desc: "Complete tuition registration, receive your Hypervisor Student Portal credentials, and begin classes.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-3 relative overflow-hidden"
            >
              <div className="text-3xl font-headline font-extrabold text-[#0f4c81]/20">
                {item.step}
              </div>
              <h3 className="font-headline font-bold text-lg text-[#0b1c30]">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Application Requirements */}
      <section className="bg-[#eff4ff] py-16 border-y border-[#c2c7d1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs uppercase font-bold text-[#0f4c81] tracking-wider">
                Eligibility Checklist
              </span>
              <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30]">
                Admission Requirements
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We welcome motivated applicants from diverse backgrounds. Below
                are the basic criteria for entry:
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "WASSCE / SSSCE / SHS Certificate or equivalent High School Diploma.",
                  "Valid Government-Issued Identification (Ghana Card, Passport, or National ID).",
                  "Basic Computer Literacy (familiarity with web browsers & operating systems).",
                  "Proficiency in spoken and written English.",
                  "Personal Laptop or Desktop computer with stable internet connectivity.",
                ].map((req, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#c2c7d1] text-xs font-medium text-[#0b1c30]"
                  >
                    <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">
                      check_circle
                    </span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white p-8 rounded-3xl border border-[#c2c7d1] shadow-lg text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0f4c81] text-white mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">
                    edit_document
                  </span>
                </div>
                <h3 className="font-headline font-bold text-xl text-[#0b1c30]">
                  Ready to Begin Your Application?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Applications are accepted on a rolling basis for upcoming
                  academic intakes. Submit your application online in under 3
                  minutes.
                </p>
                <button
                  onClick={onOpenApply}
                  className="w-full py-3.5 bg-[#0f4c81] hover:bg-[#00355f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Start Application Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Admission FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-bold text-[#0f4c81] tracking-wider">
            Common Questions
          </span>
          <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30] mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = activeFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-[#c2c7d1] overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between font-headline font-bold text-sm text-[#0b1c30] hover:text-[#0f4c81] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined text-[#0f4c81]">
                    {isOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
