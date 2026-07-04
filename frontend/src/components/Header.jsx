import React from 'react';
import { LogOut, Sun, Calendar, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-5 md:px-8 flex items-center justify-between shrink-0">
      {/* Greeting and Date */}
      <div className="flex items-center gap-3 md:gap-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg md:hidden transition-colors border border-slate-200"
          title="Open Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-sm md:text-base font-semibold text-slate-800">
            {getGreeting()}, <span className="text-indigo-600">{user.name.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{getFormattedDate()}</span>
        </div>
      </div>

      {/* Profile menu & Logout */}
      <div className="flex items-center gap-4">
        {/* Department tag */}
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
          {user.department}
        </span>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          title="Sign out of system"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
