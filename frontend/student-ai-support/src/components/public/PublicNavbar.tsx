import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface PublicNavbarProps {
  onOpenApply: (programmeId?: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  onOpenApply,
  activeTab,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "programmes", label: "Programmes" },
    { id: "admissions", label: "Admissions" },
    { id: "contact", label: "Contact" },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#0b1c30]/95 backdrop-blur-md text-white shadow-lg border-b border-white/10 py-3"
          : "bg-[#0b1c30] text-white py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img
            src="/assets/logo.png"
            alt="Hypervisor Logo"
            className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-white/20 group-hover:scale-105 transition-transform shadow-sm"
          />
          <div>
            <span className="font-headline font-bold text-lg sm:text-xl tracking-tight block leading-none">
              Hypervisor
            </span>
            <span className="text-[10px] text-slate-300 tracking-wider uppercase font-medium block mt-0.5">
              Educational Complex • Ghana
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === link.id
                  ? "bg-[#0f4c81] text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 border border-white/20 hover:border-white text-xs font-bold rounded-xl text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">login</span>
            <span>Student Portal</span>
          </button>

          <button
            onClick={() => onOpenApply()}
            className="px-5 py-2 bg-[#0f4c81] hover:bg-[#00355f] text-white text-xs font-bold rounded-xl shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Apply Now</span>
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => onOpenApply()}
            className="px-3 py-1.5 bg-[#0f4c81] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Apply
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0b1c30] border-b border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === link.id
                    ? "bg-[#0f4c81] text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
              className="w-full py-2.5 border border-white/20 text-xs font-bold rounded-xl text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Student / Admin Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
