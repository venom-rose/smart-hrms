import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  MapPin, 
  CalendarDays, 
  UserCircle, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [stats, setStats] = useState({ leavesPending: 0, leavesApproved: 0 });
  const [activities, setActivities] = useState([]);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const fetchTodayStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/attendance/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTodayAttendance(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchDashboardStatsAndActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch leaves
      const leavesRes = await fetch(`${API_URL}/leaves/my-leaves`, { headers });
      const leavesData = await leavesRes.json();
      
      // Fetch attendance logs
      const attRes = await fetch(`${API_URL}/attendance/my-attendance`, { headers });
      const attData = await attRes.json();

      let leavesList = [];
      let attList = [];

      if (leavesData.success) {
        leavesList = leavesData.data;
        const pending = leavesList.filter(l => l.status === 'Pending').length;
        const approved = leavesList.filter(l => l.status === 'Approved').length;
        setStats({ leavesPending: pending, leavesApproved: approved });
      }

      if (attData.success) {
        attList = attData.data;
      }

      // Generate activity log timeline
      const compiledActivities = [];

      // Add leave applications to timeline
      leavesList.forEach(leave => {
        compiledActivities.push({
          id: leave._id,
          type: 'leave',
          text: `Applied for ${leave.leaveType} leave (${leave.status})`,
          date: new Date(leave.appliedDate || leave.createdAt),
          badgeColor: leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : leave.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
        });
      });

      // Add shift checkins and checkouts to timeline
      attList.slice(0, 10).forEach(att => {
        compiledActivities.push({
          id: `${att._id}-in`,
          type: 'checkin',
          text: `Clocked in for shift (${att.status})`,
          date: new Date(att.checkIn),
          badgeColor: 'bg-indigo-50 text-indigo-700'
        });
        if (att.checkOut) {
          compiledActivities.push({
            id: `${att._id}-out`,
            type: 'checkout',
            text: `Completed work shift of ${att.totalHours} hrs`,
            date: new Date(att.checkOut),
            badgeColor: 'bg-slate-100 text-slate-700'
          });
        }
      });

      // Sort chronological descending
      compiledActivities.sort((a, b) => b.date - a.date);
      setActivities(compiledActivities.slice(0, 5));

    } catch (err) {
      console.error('Error compiling stats and activities:', err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchDashboardStatsAndActivity();
  }, []);

  const handleCheckIn = async () => {
    setCheckingInOut(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/attendance/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTodayAttendance(data.data);
        showNotification('Checked in successfully!');
        fetchDashboardStatsAndActivity();
      } else {
        setErrorMsg(data.message || 'Check-in failed');
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setCheckingInOut(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingInOut(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/attendance/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTodayAttendance(data.data);
        showNotification('Checked out successfully!');
        fetchDashboardStatsAndActivity();
      } else {
        setErrorMsg(data.message || 'Check-out failed');
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setCheckingInOut(false);
    }
  };

  const showNotification = (msg) => {
    // Basic browser console feedback or overlay can be added
    console.log(msg);
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Dashboard
        </h2>
        <p className="text-slate-500 text-sm mt-1">Review parameters, log hours, and check system activities.</p>
      </div>

      {/* Main Grid: Responsive 4-card hub layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: Profile Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-650">
              <UserCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
              ID: {user.employeeId}
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="font-bold text-slate-800 text-sm truncate">{user.name}</h3>
            <p className="text-xs text-slate-500 truncate">{user.designation}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link to="/profile" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-1">
              My Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CARD 2: Attendance Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
            {todayAttendance && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                todayAttendance.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {todayAttendance.status}
              </span>
            )}
          </div>
          <div className="mt-4">
            {attendanceLoading ? (
              <div className="h-10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {!todayAttendance ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingInOut}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Clock In
                  </button>
                ) : !todayAttendance.checkOut ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingInOut}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Clock Out
                  </button>
                ) : (
                  <div className="text-center py-1 text-emerald-600 font-semibold text-xs bg-emerald-50/50 border border-emerald-100 rounded-lg">
                    Shift Done: {todayAttendance.totalHours} hrs
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link to="/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-1">
              View Log <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CARD 3: Leave Requests Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="block text-lg font-bold text-slate-800">{stats.leavesPending}</span>
              <span className="text-[10px] text-slate-400 block font-medium">Pending Requests</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Approved: <span className="font-bold text-emerald-600">{stats.leavesApproved}</span> this cycle.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <Link to="/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-1">
              Apply Leave <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CARD 4: Logout Action Card */}
        <div 
          onClick={handleLogoutClick}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer group hover:border-red-200 hover:bg-red-50/10 transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-100">
              <LogOut className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="font-bold text-slate-850 text-sm group-hover:text-red-650">Sign Out</h3>
            <p className="text-xs text-slate-400">Exit from active security session</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-right group-hover:border-red-100">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-red-600 flex items-center justify-end gap-1">
              Logout Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

      {/* Recent Activity Log Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Recent Activity Logs</h3>
          <p className="text-xs text-slate-450 mt-1">Audit log of your timesheet changes and leave statuses.</p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic border border-dashed border-slate-100 rounded-xl">
            No recent activity recorded yet. Setup checks and log a shift!
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((act) => (
              <div 
                key={act.id} 
                className="flex items-center justify-between p-3.5 border border-slate-50 rounded-xl bg-slate-50/40 hover:border-slate-200 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border capitalize shrink-0 ${act.badgeColor}`}>
                    {act.type}
                  </span>
                  <span className="text-xs text-slate-700 font-semibold">{act.text}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {act.date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                  {act.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default EmployeeDashboard;
