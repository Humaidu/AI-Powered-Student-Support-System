import React, { useState } from "react";
import { PublicNavbar } from "../../components/public/PublicNavbar";
import { PublicFooter } from "../../components/public/PublicFooter";
import { FloatingAIChatWidget } from "../../components/public/FloatingAIChatWidget";
import { ApplyModal } from "../../components/public/ApplyModal";
import { HomePage } from "./HomePage";
import { AboutPage } from "./AboutPage";
import { ProgrammesPage } from "./ProgrammesPage";
import { AdmissionsPage } from "./AdmissionsPage";
import { ContactPage } from "./ContactPage";

export const PublicWebsiteLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false);
  const [selectedProgrammeForApply, setSelectedProgrammeForApply] = useState<
    string | undefined
  >(undefined);

  const handleOpenApply = (programmeId?: string) => {
    setSelectedProgrammeForApply(programmeId);
    setApplyModalOpen(true);
  };

  const handleOpenChat = () => {
    // Open floating chat widget by triggering click or state
    const floatingBtn = document.querySelector(
      'button[aria-label="Open AI Assistant"]',
    ) as HTMLButtonElement;
    if (floatingBtn) {
      floatingBtn.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col selection:bg-[#0f4c81] selection:text-white">
      {/* Sticky Header Navbar */}
      <PublicNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApply={handleOpenApply}
      />

      {/* Main Page View Area */}
      <main className="flex-1">
        {activeTab === "home" && (
          <HomePage
            setActiveTab={setActiveTab}
            onOpenApply={handleOpenApply}
            onOpenChat={handleOpenChat}
          />
        )}

        {activeTab === "about" && <AboutPage />}

        {activeTab === "programmes" && (
          <ProgrammesPage onOpenApply={handleOpenApply} />
        )}

        {activeTab === "admissions" && (
          <AdmissionsPage onOpenApply={handleOpenApply} />
        )}

        {activeTab === "contact" && <ContactPage />}
      </main>

      {/* Public Footer */}
      <PublicFooter
        setActiveTab={setActiveTab}
        onOpenApply={() => handleOpenApply()}
      />

      {/* Global AI Floating Assistant Widget */}
      <FloatingAIChatWidget />

      {/* Interactive Application Pop-up Modal */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        defaultProgrammeId={selectedProgrammeForApply}
      />
    </div>
  );
};
