import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SideNavBar } from '../components/SideNavBar';
import { TopNavBar } from '../components/TopNavBar';
import { SupportTicketModal } from '../components/SupportTicketModal';
import { useAuth } from '../hooks/useAuth';
import { useChatSessions, useChatActions } from '../hooks/useChat';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');

  const { data: sessions = [] } = useChatSessions();
  const { createSession, sendMessage } = useChatActions();

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearch.trim()) return;

    // Create session and navigate into AI Assistant with prompt pre-sent!
    const newSession = await createSession({
      title: heroSearch.slice(0, 30) + '...',
      category: 'Academic'
    });
    await sendMessage({ sessionId: newSession.id, content: heroSearch });
    navigate(`/assistant?session=${newSession.id}`);
  };

  const handleQuickAction = async (prompt: string, category: string) => {
    const newSession = await createSession({
      title: prompt,
      category
    });
    await sendMessage({ sessionId: newSession.id, content: prompt });
    navigate(`/assistant?session=${newSession.id}`);
  };

  return (
    <div className="flex h-screen w-screen bg-[#f8f9ff] overflow-hidden">
      {/* Side Navigation Bar */}
      <SideNavBar onOpenSupportTicket={() => setSupportModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        {/* Top Header */}
        <TopNavBar searchPlaceholder="Search academic resources, courses, regulations..." />

        {/* Dashboard Workspace */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Hero Section */}
          <section className="bg-[#00355f] text-white rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#0f4c81]/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full border border-white/20 text-xs text-[#8ebdf9] font-medium">
                <span className="material-symbols-outlined text-[16px]">sparkles</span>
                AI Support Portal Active
              </div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                Good morning, {user?.name.split(' ')[0] || 'James'}
              </h1>
              <p className="text-lg text-white/80 font-light">
                How can we help you today?
              </p>

              {/* Central Search Input */}
              <form onSubmit={handleSearchSubmit} className="pt-2">
                <div className="relative flex items-center search-glow rounded-2xl overflow-hidden shadow-xl bg-white text-[#0b1c30]">
                  <span className="material-symbols-outlined absolute left-4 text-[#0f4c81] text-[24px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Ask about registration, exams, fees, hostel, graduation..."
                    className="w-full pl-12 pr-28 py-4 text-sm md:text-base outline-none bg-transparent placeholder:text-[#42474f]/60 font-medium"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-5 py-2.5 bg-[#00355f] hover:bg-[#0f4c81] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 uppercase tracking-wider"
                  >
                    <span>Ask AI</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Quick Actions Grid (6 Bento Cards) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-[#00355f] flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">grid_view</span>
                Quick Academic Services
              </h2>
              <span className="text-xs text-[#42474f] font-medium">Verified RAG Knowledge Base</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Action 1: Academic Calendar */}
              <div
                onClick={() => handleQuickAction('What are the key dates for the 2024 academic calendar?', 'Academic')}
                className="bg-white p-5 rounded-2xl border border-[#c2c7d1] bento-card-hover cursor-pointer group shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0f4c81] flex items-center justify-center group-hover:bg-[#00355f] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">calendar_month</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#00355f] group-hover:text-[#0f4c81] transition-colors">
                    Academic Calendar
                  </h3>
                  <p className="text-xs text-[#42474f] mt-1 line-clamp-2">
                    Key semester start/end dates, add/drop periods, holidays, and examination schedules.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#0f4c81] group-hover:translate-x-1 transition-transform">
                  <span>View Key Dates</span>
                  <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
                </div>
              </div>

              {/* Action 2: Course Registration */}
              <div
                onClick={() => handleQuickAction('How do I register for Fall 2024 courses and prerequisites?', 'Academic')}
                className="bg-white p-5 rounded-2xl border border-[#c2c7d1] bento-card-hover cursor-pointer group shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0f4c81] flex items-center justify-center group-hover:bg-[#00355f] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">how_to_reg</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#00355f] group-hover:text-[#0f4c81] transition-colors">
                    Course Registration
                  </h3>
                  <p className="text-xs text-[#42474f] mt-1 line-clamp-2">
                    Enrollment limits, credit overload approvals, prerequisite checks, and course add/drop rules.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#0f4c81] group-hover:translate-x-1 transition-transform">
                  <span>Check Requirements</span>
                  <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
                </div>
              </div>

              {/* Action 3: Examinations */}
              <div
                onClick={() => handleQuickAction('What is the midterm and final examination policy?', 'Academic')}
                className="bg-white p-5 rounded-2xl border border-[#c2c7d1] bento-card-hover cursor-pointer group shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0f4c81] flex items-center justify-center group-hover:bg-[#00355f] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">assignment</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#00355f] group-hover:text-[#0f4c81] transition-colors">
                    Examinations
                  </h3>
                  <p className="text-xs text-[#42474f] mt-1 line-clamp-2">
                    Venue seat allocations, deferral applications, re-grading policies, and exam guidelines.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#0f4c81] group-hover:translate-x-1 transition-transform">
                  <span>Exam Guidelines</span>
                  <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
                </div>
              </div>

              {/* Action 4: Fees */}
              <div
                onClick={() => handleQuickAction('Explain tuition fees, payment instalments, and merit aid.', 'Finance')}
                className="bg-white p-5 rounded-2xl border border-[#c2c7d1] bento-card-hover cursor-pointer group shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0f4c81] flex items-center justify-center group-hover:bg-[#00355f] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#00355f] group-hover:text-[#0f4c81] transition-colors">
                    Fees & Bursar
                  </h3>
                  <p className="text-xs text-[#42474f] mt-1 line-clamp-2">
                    Tuition rates, payment portal links, late fee waivers, and financial aid disbursements.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#0f4c81] group-hover:translate-x-1 transition-transform">
                  <span>Fee Schedules</span>
                  <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
                </div>
              </div>

              {/* Action 5: Hostel */}
              <div
                onClick={() => handleQuickAction('What are the residence hall guidelines and digital key replacement rules?', 'Housing')}
                className="bg-white p-5 rounded-2xl border border-[#c2c7d1] bento-card-hover cursor-pointer group shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0f4c81] flex items-center justify-center group-hover:bg-[#00355f] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">apartment</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#00355f] group-hover:text-[#0f4c81] transition-colors">
                    Hostel & Housing
                  </h3>
                  <p className="text-xs text-[#42474f] mt-1 line-clamp-2">
                    Residence hall room allocations, keycard maintenance, guest rules, and room swap protocols.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#0f4c81] group-hover:translate-x-1 transition-transform">
                  <span>Housing Rules</span>
                  <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
                </div>
              </div>

              {/* Action 6: Student Handbook */}
              <div
                onClick={() => handleQuickAction('Summarize academic integrity guidelines from the 2024 Student Handbook.', 'General')}
                className="bg-white p-5 rounded-2xl border border-[#c2c7d1] bento-card-hover cursor-pointer group shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0f4c81] flex items-center justify-center group-hover:bg-[#00355f] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#00355f] group-hover:text-[#0f4c81] transition-colors">
                    Student Handbook
                  </h3>
                  <p className="text-xs text-[#42474f] mt-1 line-clamp-2">
                    Comprehensive institutional code of conduct, disciplinary policies, and campus resources.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#0f4c81] group-hover:translate-x-1 transition-transform">
                  <span>Browse Handbook</span>
                  <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Conversations List */}
          <section className="bg-white rounded-2xl border border-[#c2c7d1] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#c2c7d1] pb-4">
              <div>
                <h2 className="font-headline text-lg font-bold text-[#00355f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                  Recent Conversations
                </h2>
                <p className="text-xs text-[#42474f] mt-0.5">Resume your recent AI support sessions and research inquiries.</p>
              </div>
              <button
                onClick={() => navigate('/conversations')}
                className="text-xs font-bold text-[#0f4c81] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="divide-y divide-[#c2c7d1]/50">
              {sessions.slice(0, 5).map(session => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/assistant?session=${session.id}`)}
                  className="py-3.5 px-2 hover:bg-[#eff4ff] rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 bg-[#dce9ff] text-[#0f4c81] rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">forum</span>
                    </div>
                    <div>
                      <h4 className="font-headline text-sm font-bold text-[#0b1c30] group-hover:text-[#0f4c81] transition-colors">
                        {session.title}
                      </h4>
                      <p className="text-xs text-[#42474f] line-clamp-1 mt-0.5">
                        {session.lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-0.5 bg-[#eff4ff] border border-[#c2c7d1] text-[#445a7f] text-[11px] font-semibold rounded-full">
                      {session.category}
                    </span>
                    <span className="text-[11px] text-[#727780] font-medium hidden sm:inline-block">
                      {session.updatedAt}
                    </span>
                    <span className="material-symbols-outlined text-[#727780] group-hover:text-[#0f4c81] group-hover:translate-x-0.5 transition-all text-[20px]">
                      chevron_right
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Support Ticket Modal */}
      <SupportTicketModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </div>
  );
};
