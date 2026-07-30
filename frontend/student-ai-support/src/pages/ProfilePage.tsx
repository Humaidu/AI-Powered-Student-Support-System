import React, { useState } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { TopNavBar } from '../components/TopNavBar';
import { SupportTicketModal } from '../components/SupportTicketModal';
import { useAuth } from '../hooks/useAuth';
import { config } from '../config/environment';

export const ProfilePage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#f8f9ff] overflow-hidden">
      <SideNavBar onOpenSupportTicket={() => setSupportModalOpen(true)} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        <TopNavBar searchPlaceholder="Search user settings..." />
        <main className="p-6 md:p-8 space-y-6 max-w-4xl w-full mx-auto">
          <div className="bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#00355f]"
              />
              <div>
                <h1 className="font-headline text-2xl font-bold text-[#00355f]">{user?.name}</h1>
                <p className="text-xs text-[#42474f] font-semibold uppercase">{user?.title} • {user?.department}</p>
                <p className="text-xs text-[#727780]">{user?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#c2c7d1] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl space-y-2">
                <h3 className="font-headline font-bold text-sm text-[#00355f]">Active Role & Permissions</h3>
                <p className="text-xs text-[#0b1c30]">Role: <strong className="uppercase">{user?.role}</strong></p>
                <p className="text-xs text-[#42474f]">
                  {user?.role === 'ADMIN'
                    ? 'Full access to document governance, RAG embedding pipeline, and approval queues.'
                    : 'Access to student AI advisement, course inquiry, and personal conversation history.'}
                </p>
                <button
                  onClick={() => switchRole(user?.role === 'ADMIN' ? 'STUDENT' : 'ADMIN')}
                  className="px-3 py-1.5 bg-[#00355f] text-white text-xs font-bold rounded-lg hover:bg-[#0f4c81] cursor-pointer transition-all"
                >
                  Switch to {user?.role === 'ADMIN' ? 'Student' : 'Admin'} Role
                </button>
              </div>

              <div className="p-4 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl space-y-2">
                <h3 className="font-headline font-bold text-sm text-[#00355f]">System Architecture Mode</h3>
                <p className="text-xs text-[#0b1c30]">Execution Mode: <strong className="uppercase font-mono">{config.APP_MODE}</strong></p>
                <p className="text-xs text-[#42474f]">
                  Backend API: <code className="text-[#0f4c81] font-mono">{config.API_BASE_URL}</code>
                </p>
                <p className="text-[11px] text-[#727780]">
                  This app follows a strict service abstraction layer (Component → Hook → API → Service → Provider).
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <SupportTicketModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </div>
  );
};
