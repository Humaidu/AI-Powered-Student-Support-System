import React, { useState } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { TopNavBar } from '../components/TopNavBar';
import { SupportTicketModal } from '../components/SupportTicketModal';

export const HelpPage: React.FC = () => {
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const faqs = [
    {
      q: 'How does the AI Assistant retrieve accurate institutional information?',
      a: 'The Hypervisor Educational Complex AI platform utilizes Retrieval-Augmented Generation (RAG). When you ask a question, the system queries a high-performance vector search engine (OpenSearch) containing official university handbooks, policy manuals, and academic calendars, then generates a verified response backed by source page citations.'
    },
    {
      q: 'Where can I find my course registration add/drop deadline?',
      a: 'Add/drop deadlines are published under the Academic Calendar. You can also type "What is the add/drop deadline for Fall 2024?" into the AI Assistant to view exact dates and page numbers from the Student Handbook.'
    },
    {
      q: 'What should I do if my digital hostel lock fails?',
      a: 'Report digital door lock or smart card failures immediately to Housing Maintenance via a Support Ticket or visit the Residence Directorate in Block C. First-time technical replacements are free of charge.'
    },
    {
      q: 'When will Merit Scholarship disbursements reflect on my bursar statement?',
      a: 'Merit aid disbursements for verified eligible students reflect on student accounts within 10-14 business days following official enrollment verification by the Admissions Directorate.'
    }
  ];

  return (
    <div className="flex h-screen w-screen bg-[#f8f9ff] overflow-hidden">
      <SideNavBar onOpenSupportTicket={() => setSupportModalOpen(true)} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        <TopNavBar searchPlaceholder="Search help center..." />
        <main className="p-6 md:p-8 space-y-6 max-w-5xl w-full mx-auto">
          <div className="bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-2">
            <h1 className="font-headline text-2xl font-bold text-[#00355f] flex items-center gap-2">
              <span className="material-symbols-outlined text-[28px]">help</span>
              Help & Knowledge Center
            </h1>
            <p className="text-sm text-[#42474f]">
              Frequently asked questions and platform support documentation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-4">
            <h2 className="font-headline text-lg font-bold text-[#00355f]">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl space-y-1.5">
                  <h3 className="font-headline font-bold text-sm text-[#00355f] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0f4c81] text-[18px]">quiz</span>
                    {faq.q}
                  </h3>
                  <p className="text-xs text-[#0b1c30] leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#00355f] text-white p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-headline font-bold text-lg">Still need administrative assistance?</h3>
              <p className="text-xs text-[#8ebdf9] mt-0.5">Submit an official ticket to the Registrar or Bursar office.</p>
            </div>
            <button
              onClick={() => setSupportModalOpen(true)}
              className="px-5 py-2.5 bg-white text-[#00355f] font-bold text-xs rounded-xl hover:bg-[#8ebdf9] transition-all cursor-pointer shadow-sm uppercase tracking-wider"
            >
              Open Support Ticket
            </button>
          </div>
        </main>
      </div>
      <SupportTicketModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </div>
  );
};
