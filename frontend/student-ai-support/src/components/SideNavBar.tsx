import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface SideNavBarProps {
  onOpenSupportTicket?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  onOpenSupportTicket,
}) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate("/login");
  };

  const toggleRole = async () => {
    const nextRole = user?.role === "ADMIN" ? "STUDENT" : "ADMIN";
    await switchRole(nextRole);
  };

  return (
    <aside className="w-[260px] h-screen sticky left-0 top-0 bg-[#eff4ff] border-r border-[#c2c7d1] flex flex-col p-4 space-y-2 shrink-0 z-50 select-none">
      {/* Brand Identity */}
      <div
        className="flex items-center gap-3 px-2 py-3 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <img
          src="/assets/logo.png"
          alt="Hypervisor Logo"
          className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-[#8ebdf9]/30 shadow-sm"
        />
        <div>
          <h1 className="font-headline text-[18px] font-bold text-[#00355f] leading-tight">
            Hypervisor
          </h1>
          <p className="text-[10px] text-[#42474f] uppercase tracking-wider font-semibold">
            Educational Complex
          </p>
        </div>
      </div>

      {/* Role Switcher Pill for Testing AWS Architecture & Admin Workflow */}
      <div className="mx-2 my-1 px-3 py-1.5 bg-[#dce9ff] rounded-lg flex items-center justify-between text-xs font-medium text-[#00355f]">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="material-symbols-outlined text-[16px]">
            verified_user
          </span>
          {user?.role || "STUDENT"} MODE
        </span>
        <button
          onClick={toggleRole}
          className="text-[10px] uppercase font-bold text-[#0f4c81] hover:underline cursor-pointer bg-white/70 px-1.5 py-0.5 rounded"
          title="Switch role between Student and Admin"
        >
          Switch
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1 pt-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-sm font-medium ${
              isActive
                ? "bg-[#0f4c81] text-[#8ebdf9] font-semibold shadow-sm"
                : "text-[#42474f] hover:bg-[#dce9ff] hover:text-[#0b1c30]"
            }`
          }
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/assistant"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-sm font-medium ${
              isActive
                ? "bg-[#0f4c81] text-[#8ebdf9] font-semibold shadow-sm"
                : "text-[#42474f] hover:bg-[#dce9ff] hover:text-[#0b1c30]"
            }`
          }
        >
          <span className="material-symbols-outlined filled">smart_toy</span>
          <span>AI Assistant</span>
        </NavLink>

        <NavLink
          to="/conversations"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-sm font-medium ${
              isActive
                ? "bg-[#0f4c81] text-[#8ebdf9] font-semibold shadow-sm"
                : "text-[#42474f] hover:bg-[#dce9ff] hover:text-[#0b1c30]"
            }`
          }
        >
          <span className="material-symbols-outlined">forum</span>
          <span>Conversations</span>
        </NavLink>

        {user?.role === "ADMIN" && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-sm font-medium ${
                isActive
                  ? "bg-[#0f4c81] text-[#8ebdf9] font-semibold shadow-sm"
                  : "text-[#42474f] hover:bg-[#dce9ff] hover:text-[#0b1c30]"
              }`
            }
          >
            <span className="material-symbols-outlined">
              admin_panel_settings
            </span>
            <span>Admin & RAG Pipeline</span>
          </NavLink>
        )}

        <NavLink
          to="/help"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-sm font-medium ${
              isActive
                ? "bg-[#0f4c81] text-[#8ebdf9] font-semibold shadow-sm"
                : "text-[#42474f] hover:bg-[#dce9ff] hover:text-[#0b1c30]"
            }`
          }
        >
          <span className="material-symbols-outlined">help</span>
          <span>Help</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-sm font-medium ${
              isActive
                ? "bg-[#0f4c81] text-[#8ebdf9] font-semibold shadow-sm"
                : "text-[#42474f] hover:bg-[#dce9ff] hover:text-[#0b1c30]"
            }`
          }
        >
          <span className="material-symbols-outlined">account_circle</span>
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Bottom Footer Actions */}
      <div className="pt-3 border-t border-[#c2c7d1] space-y-1">
        <button
          onClick={onOpenSupportTicket}
          className="w-full flex items-center justify-center gap-2 bg-[#00355f] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-[#0f4c81] transition-all cursor-pointer active:scale-[0.98] mb-2 shadow-sm uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Support Ticket
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 px-4 py-2 text-[#42474f] hover:bg-[#dce9ff] hover:text-[#0b1c30] rounded-lg transition-all cursor-pointer text-sm"
        >
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-all cursor-pointer text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[#ba1a1a]">
            logout
          </span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
