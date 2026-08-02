import React from "react";
import { FOUNDERS } from "../../data/websiteData";

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-16 pb-16 pt-20">
      {/* Hero Banner */}
      <section className="bg-[#0b1c30] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <span className="text-xs uppercase font-bold tracking-widest text-[#60a5fa] px-3.5 py-1.5 bg-white/5 rounded-full border border-white/10 inline-block">
            About Hypervisor Educational Complex
          </span>
          <h1 className="font-headline text-3xl sm:text-5xl font-extrabold tracking-tight">
            Empowering Africa's Next Generation of Tech Leaders
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Headquartered in Accra, Ghana, Hypervisor Educational Complex is a
            leading technology institute dedicated to practical software
            engineering, cloud architecture, cyber defense, and digital
            innovation.
          </p>
        </div>
      </section>

      {/* Institutional History & Background */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs uppercase font-bold text-[#0f4c81] tracking-wider">
              Our Journey
            </span>
            <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30]">
              Built for Practical Skill Mastery
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Founded in Accra, Ghana, Hypervisor Educational Complex was
              established to address the growing global demand for
              industry-ready tech talent across Africa. By combining hands-on
              virtual laboratory exercises with direct mentorship from
              practicing engineers, Hypervisor equips students with practical
              capabilities that translate immediately to software and cloud
              engineering roles.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Today, Hypervisor serves learners across West Africa and
              internationally through hybrid classroom models, high-performance
              cloud environments, and AI-assisted academic support systems.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-[#c2c7d1] shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                alt="African technology students collaborating"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Values */}
      <section className="bg-[#eff4ff] py-16 border-y border-[#c2c7d1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0f4c81] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">flag</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-[#0b1c30]">
                Our Mission
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To deliver world-class, career-aligned technology education in
                Africa through accessible online platforms, rigorous hands-on
                projects, and continuous mentorship.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#00355f] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  visibility
                </span>
              </div>
              <h3 className="font-headline font-bold text-xl text-[#0b1c30]">
                Our Vision
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To become Africa's standard-setting technology institution,
                recognized globally for producing innovative software
                architects, cloud engineers, and digital leaders.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  workspace_premium
                </span>
              </div>
              <h3 className="font-headline font-bold text-xl text-[#0b1c30]">
                Core Values
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Practical Excellence • Integrity & Rigor • Student Empowerment •
                Continuous Innovation • African Technology Leadership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section - Founders */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold text-[#0f4c81] tracking-wider">
            Institutional Governance
          </span>
          <h2 className="font-headline text-3xl font-extrabold text-[#0b1c30] mt-1">
            Leadership Team & Founders
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            The founding leadership steering academic vision, technological
            infrastructure, and student success at Hypervisor Educational
            Complex.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {FOUNDERS.map((founder, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#c2c7d1] p-6 text-center shadow-xs hover:border-[#0f4c81] hover:shadow-md transition-all group"
            >
              <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#eff4ff] shadow-sm group-hover:scale-105 transition-transform">
                <img
                  src={founder.image}
                  alt={founder.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="font-headline font-bold text-base text-[#0b1c30] group-hover:text-[#0f4c81] transition-colors">
                {founder.name}
              </h3>

              <p className="text-xs font-semibold text-[#0f4c81] mt-1">
                {founder.role}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
