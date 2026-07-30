import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface TopNavBarProps {
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  showFilters?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  searchPlaceholder = 'Search resources...',
  onSearchChange,
  showFilters = false
}) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-white border-b border-[#c2c7d1] shadow-xs flex items-center justify-between px-6">
      {/* Search Input & Optional Filters */}
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42474f] text-[20px]">
            search
          </span>
          <input
            type="text"
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-[#eff4ff] border border-[#c2c7d1] rounded-full text-sm text-[#0b1c30] placeholder:text-[#42474f]/60 focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] transition-all"
          />
        </div>

        {showFilters && (
          <div className="hidden md:flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#eff4ff] cursor-pointer transition-colors border border-transparent hover:border-[#c2c7d1]">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span className="text-xs font-medium text-[#42474f]">Date</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#eff4ff] cursor-pointer transition-colors border border-transparent hover:border-[#c2c7d1]">
              <span className="material-symbols-outlined text-[18px]">domain</span>
              <span className="text-xs font-medium text-[#42474f]">Department</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#eff4ff] cursor-pointer transition-colors border border-transparent hover:border-[#c2c7d1]">
              <span className="material-symbols-outlined text-[18px]">sort</span>
              <span className="text-xs font-medium text-[#42474f]">Sort</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#42474f] hover:bg-[#eff4ff] rounded-full transition-colors relative cursor-pointer active:scale-95"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#c2c7d1] rounded-xl shadow-lg p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-3 border-b border-[#c2c7d1] pb-2">
                <h4 className="font-headline font-semibold text-sm text-[#00355f]">Notifications</h4>
                <span className="text-[10px] uppercase bg-[#bbd3fd] text-[#445a7f] font-bold px-2 py-0.5 rounded-full">2 New</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-2 bg-[#eff4ff] rounded-lg">
                  <p className="font-semibold text-[#0b1c30]">Academic Merit Scholarship Approved</p>
                  <p className="text-[#42474f] text-[11px] mt-0.5">Your Fall 2024 eligibility status is verified by Admissions.</p>
                  <span className="text-[10px] text-[#727780] mt-1 block">10 mins ago</span>
                </div>
                <div className="p-2 hover:bg-[#eff4ff] rounded-lg cursor-pointer">
                  <p className="font-semibold text-[#0b1c30]">Exam Timetable Released</p>
                  <p className="text-[#42474f] text-[11px] mt-0.5">Mid-term exam schedules are now available under Examinations.</p>
                  <span className="text-[10px] text-[#727780] mt-1 block">2 hours ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-[#c2c7d1] mx-1"></div>

        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 cursor-pointer hover:bg-[#eff4ff] p-1.5 rounded-lg transition-all group select-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#0b1c30] leading-none">{user?.name || 'James Wilson'}</p>
              <p className="text-[10px] text-[#42474f] uppercase font-semibold mt-1 tracking-wider">
                {user?.title || 'UNDERGRADUATE'}
              </p>
            </div>
            <img
              src={user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs-iaqeN3xdi1x_sPBdaomSQ-ab0TZ707LFzngstYljiEHoV_4261hIdq9ml8z2UrAI8Yu7ouWc0LL9mEFojtNhlx7NUESMcGwGKrXkFb7Y4x8SduAROJzWrP3YKwXo8dYjR-TdwPLJu39IxR0bRkcuyLGrPjl_Iua5oR1wr98oQHfHsS_PENPLb5nX5Rx67qeQgxZmS1NCf9TvoylpwNyYRSm9C9Mze-Y9bVTyCjbso9yvVXU-w6ZAi4P7EcZi64zeOi16zCFwrI'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-[#c2c7d1] group-hover:ring-2 group-hover:ring-[#0f4c81]/20 transition-all"
            />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#c2c7d1] rounded-xl shadow-lg p-2 z-50">
              <div className="px-3 py-2 border-b border-[#c2c7d1]">
                <p className="font-bold text-xs text-[#0b1c30]">{user?.name}</p>
                <p className="text-[11px] text-[#42474f]">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="w-full text-left px-3 py-2 text-xs text-[#42474f] hover:bg-[#eff4ff] hover:text-[#0b1c30] rounded-md transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>My Profile</span>
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); switchRole(user?.role === 'ADMIN' ? 'STUDENT' : 'ADMIN'); }}
                className="w-full text-left px-3 py-2 text-xs text-[#0f4c81] font-semibold hover:bg-[#eff4ff] rounded-md transition-colors cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                <span>Switch to {user?.role === 'ADMIN' ? 'Student' : 'Admin'} Role</span>
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }}
                className="w-full text-left px-3 py-2 text-xs text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition-colors cursor-pointer flex items-center gap-2 mt-1 border-t border-[#c2c7d1]"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
