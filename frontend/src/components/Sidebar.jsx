import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  Wallet, 
  UserCircle, 
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const adminLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/leaves', label: 'Leaves', icon: CalendarDays },
    { to: '/payroll', label: 'Payroll', icon: Wallet },
    { to: '/profile', label: 'My Profile', icon: UserCircle },
  ];

  const employeeLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/leaves', label: 'Leaves', icon: CalendarDays },
    { to: '/payroll', label: 'Payroll', icon: Wallet },
    { to: '/profile', label: 'My Profile', icon: UserCircle },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <>
      {/* Backdrop overlay for mobile viewport */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 md:hidden animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar navigation drawer panel */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white text-slate-600 min-h-screen flex flex-col border-r border-slate-200 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-in-out shrink-0`}>
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-indigo-650" />
            <span className="text-base font-bold text-slate-800 tracking-wide">Smart HRMS</span>
          </div>
          
          {/* Close button for mobile viewport */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg md:hidden transition-colors border border-slate-250"
            title="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)} // Auto-close drawer on link click for mobile
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-650 shrink-0">
              {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{user.name}</h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">{user.role}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
