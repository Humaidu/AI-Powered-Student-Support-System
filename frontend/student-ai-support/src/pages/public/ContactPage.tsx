import React, { useState } from "react";

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    programme: "General Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-16 pb-16 pt-20">
      {/* Header */}
      <section className="bg-[#0b1c30] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#60a5fa] px-3.5 py-1.5 bg-white/5 rounded-full border border-white/10 inline-block">
            Get in Touch
          </span>
          <h1 className="font-headline text-3xl sm:text-5xl font-extrabold tracking-tight">
            Contact Hypervisor Educational Complex
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Our admissions team and academic advisors are here to answer your
            questions and assist with your application.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Contact Form UI */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-[#c2c7d1] shadow-lg">
            <h2 className="font-headline text-2xl font-bold text-[#0b1c30] mb-2">
              Send Us a Message
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              Fill out the form below and an admissions counselor will respond
              within 24 hours.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abena Mensah"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
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
                      placeholder="abena@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+233 20 000 0000"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                    Topic of Interest
                  </label>
                  <select
                    value={formData.programme}
                    onChange={(e) =>
                      setFormData({ ...formData, programme: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm font-medium text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
                  >
                    <option value="General Inquiry">
                      General Admissions Inquiry
                    </option>
                    <option value="Diploma in IT">
                      Diploma in Information Technology
                    </option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="Web Development">Web Development</option>
                    <option value="DevOps Engineering">
                      DevOps Engineering
                    </option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0f4c81] hover:bg-[#00355f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Submit Message</span>
                  <span className="material-symbols-outlined text-base">
                    send
                  </span>
                </button>
              </form>
            ) : (
              <div className="p-8 text-center space-y-3 bg-[#eff4ff] rounded-2xl border border-[#bbd3fd]">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">
                    check_circle
                  </span>
                </div>
                <h3 className="font-headline font-bold text-lg text-[#0b1c30]">
                  Message Received!
                </h3>
                <p className="text-xs text-slate-600">
                  Thank you for reaching out, <strong>{formData.name}</strong>.
                  An admissions officer will respond to{" "}
                  <strong>{formData.email}</strong> shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-[#0b1c30] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>

          {/* Right: Contact Information & Accra Ghana Campus Map */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0b1c30] text-white p-8 rounded-3xl border border-white/10 shadow-lg space-y-6">
              <h3 className="font-headline text-xl font-bold border-b border-white/10 pb-3">
                Accra Campus & Office
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#60a5fa] text-xl shrink-0">
                    location_on
                  </span>
                  <div>
                    <p className="font-bold text-white">
                      Hypervisor Educational Complex
                    </p>
                    <p className="text-slate-300 mt-0.5">
                      Airport Residential Area, Independence Avenue
                    </p>
                    <p className="text-slate-300">Accra, Ghana</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#60a5fa] text-xl shrink-0">
                    mail
                  </span>
                  <div>
                    <p className="font-bold text-white">Official Email</p>
                    <p className="text-slate-300">
                      admissions@hypervisor.edu.gh
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#60a5fa] text-xl shrink-0">
                    call
                  </span>
                  <div>
                    <p className="font-bold text-white">Telephone Lines</p>
                    <p className="text-slate-300">
                      +233 (0) 30 298 4500 / +233 (0) 55 123 4567
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#60a5fa] text-xl shrink-0">
                    schedule
                  </span>
                  <div>
                    <p className="font-bold text-white">Business Hours</p>
                    <p className="text-slate-300">
                      Monday - Friday: 8:00 AM - 6:00 PM GMT
                    </p>
                    <p className="text-slate-300">
                      Saturday: 9:00 AM - 2:00 PM GMT
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Map Graphic for Accra Ghana */}
            <div className="bg-white p-4 rounded-3xl border border-[#c2c7d1] shadow-md space-y-2">
              <div className="relative h-48 rounded-2xl overflow-hidden bg-[#e5e7eb] flex items-center justify-center border border-[#c2c7d1]">
                {/* SVG Stylized Map of Accra */}
                <svg
                  className="w-full h-full opacity-60"
                  viewBox="0 0 400 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 50 Q100 80 200 40 T400 90"
                    stroke="#0f4c81"
                    strokeWidth="6"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M50 0 Q120 100 250 200"
                    stroke="#c2c7d1"
                    strokeWidth="4"
                  />
                  <rect
                    x="180"
                    y="70"
                    width="80"
                    height="50"
                    rx="8"
                    fill="#0f4c81"
                    fillOpacity="0.1"
                    stroke="#0f4c81"
                    strokeWidth="2"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="material-symbols-outlined text-red-600 text-3xl animate-bounce">
                    location_on
                  </span>
                  <span className="bg-[#0b1c30] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    Accra Campus • Ghana
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Independence Avenue, Airport Residential Area, Accra, Ghana
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
