import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SideNavBar } from '../components/SideNavBar';
import { TopNavBar } from '../components/TopNavBar';
import { SupportTicketModal } from '../components/SupportTicketModal';
import { useChatSessions, useChatActions } from '../hooks/useChat';

export const ConversationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const { data: sessions = [], isLoading } = useChatSessions();
  const { deleteSession, pinSession } = useChatActions();

  const handleTogglePin = async (e: React.MouseEvent, id: string, currentPin: boolean) => {
    e.stopPropagation();
    await pinSession({ sessionId: id, isPinned: !currentPin });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation session?')) {
      await deleteSession(id);
    }
  };

  // Filter sessions
  const filtered = sessions.filter(s => {
    const matchesCategory = selectedCategory === 'ALL' || s.category.toUpperCase() === selectedCategory;
    const matchesSearch = s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.lastMessage.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesArchive = showArchived ? s.isArchived : !s.isArchived;
    return matchesCategory && matchesSearch && matchesArchive;
  });

  const pinnedSessions = filtered.filter(s => s.isPinned);
  const regularSessions = filtered.filter(s => !s.isPinned);

  const categories = ['ALL', 'ACADEMIC', 'HOUSING', 'FINANCE', 'RESEARCH', 'STUDENT AFFAIRS', 'OPERATIONS', 'LEGAL'];

  return (
    <div className="flex h-screen w-screen bg-[#f8f9ff] overflow-hidden">
      {/* Side Navigation Bar */}
      <SideNavBar onOpenSupportTicket={() => setSupportModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        {/* Top Header with Filters */}
        <TopNavBar
          searchPlaceholder="Search historical AI research sessions..."
          onSearchChange={(val) => setSearchFilter(val)}
          showFilters={true}
        />

        {/* Workspace Container */}
        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Bar & Archive Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs">
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#00355f] flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[28px]">forum</span>
                Conversations History
              </h1>
              <p className="text-sm text-[#42474f] mt-1">
                Review your historical AI research sessions and administrative inquiries.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                  showArchived
                    ? 'bg-[#00355f] text-white border-[#00355f]'
                    : 'bg-[#eff4ff] text-[#0f4c81] border-[#c2c7d1] hover:bg-[#dce9ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">archive</span>
                <span>{showArchived ? 'Viewing Archive' : 'View Archive'}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#0f4c81] text-white shadow-xs'
                    : 'bg-white border border-[#c2c7d1] text-[#42474f] hover:bg-[#eff4ff]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-[#0f4c81] font-semibold flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-[#0f4c81] border-t-transparent rounded-full animate-spin"></span>
              Loading conversations...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pinned Sessions Section */}
              {pinnedSessions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00355f] uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[#00355f] text-[18px]">push_pin</span>
                    <span>Pinned Sessions ({pinnedSessions.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {pinnedSessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => navigate(`/assistant?session=${session.id}`)}
                        className="bg-white border-2 border-[#00355f]/30 hover:border-[#00355f] p-5 rounded-2xl shadow-xs transition-all cursor-pointer group flex items-start justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 bg-[#00355f] text-white text-[10px] font-extrabold uppercase rounded-full">
                              {session.category}
                            </span>
                            <span className="text-xs text-[#727780] font-medium">{session.updatedAt}</span>
                            <span className="text-xs text-[#42474f]">• {session.messageCount} messages</span>
                          </div>

                          <h3 className="font-headline font-bold text-base text-[#00355f] group-hover:text-[#0f4c81] transition-colors">
                            {session.title}
                          </h3>
                          <p className="text-xs text-[#42474f] line-clamp-2 leading-relaxed">
                            {session.lastMessage}
                          </p>
                        </div>

                        {/* Hover Action Buttons */}
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleTogglePin(e, session.id, true)}
                            className="p-2 text-[#00355f] hover:bg-[#eff4ff] rounded-lg cursor-pointer transition-colors"
                            title="Unpin Session"
                          >
                            <span className="material-symbols-outlined text-[20px] filled">push_pin</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, session.id)}
                            className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg cursor-pointer transition-colors"
                            title="Delete Session"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Conversations List */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#42474f] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  <span>All Interactions ({regularSessions.length})</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {regularSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => navigate(`/assistant?session=${session.id}`)}
                      className="bg-white border border-[#c2c7d1] hover:border-[#0f4c81] p-5 rounded-2xl shadow-xs transition-all cursor-pointer group flex items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-0.5 bg-[#eff4ff] border border-[#c2c7d1] text-[#0f4c81] text-[10px] font-bold uppercase rounded-full">
                            {session.category}
                          </span>
                          <span className="text-xs text-[#727780] font-medium">{session.updatedAt}</span>
                          <span className="text-xs text-[#42474f]">• {session.messageCount} messages</span>
                        </div>

                        <h3 className="font-headline font-bold text-base text-[#0b1c30] group-hover:text-[#0f4c81] transition-colors">
                          {session.title}
                        </h3>
                        <p className="text-xs text-[#42474f] line-clamp-2 leading-relaxed">
                          {session.lastMessage}
                        </p>
                      </div>

                      {/* Hover Action Buttons */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleTogglePin(e, session.id, false)}
                          className="p-2 text-[#42474f] hover:bg-[#eff4ff] hover:text-[#00355f] rounded-lg cursor-pointer transition-colors"
                          title="Pin Session"
                        >
                          <span className="material-symbols-outlined text-[20px]">push_pin</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="p-2 text-[#42474f] hover:bg-[#ffdad6] hover:text-[#ba1a1a] rounded-lg cursor-pointer transition-colors"
                          title="Delete Session"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load Previous Interactions Pagination Button */}
              <div className="pt-4 text-center">
                <button
                  onClick={() => alert('All available historical interactions have been loaded.')}
                  className="px-6 py-3 bg-white border border-[#c2c7d1] hover:bg-[#eff4ff] text-[#0f4c81] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Load previous interactions
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Support Ticket Modal */}
      <SupportTicketModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </div>
  );
};
