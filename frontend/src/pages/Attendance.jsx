import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  User, 
  HelpCircle, 
  Loader2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  UserCheck, 
  XCircle, 
  Info,
  CalendarDays, 
  Check, 
  Grid, 
  List,
  UserX,
  FileText,
  AlertCircle,
  Download,
  BarChart3,
  PieChart
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Attendance = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Mode state for Admin: 'dashboard' | 'analytics' | 'individual'
  const [adminMode, setAdminMode] = useState('dashboard');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'

  // Selection states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD

  // Admin selection state
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  
  // Filtering states for admin team dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Loaded Data states
  const [sheetData, setSheetData] = useState(null); // personal or targeted individual's sheet
  const [dailyStatusData, setDailyStatusData] = useState(null); // admin team roster
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const yearsList = [currentYear - 2, currentYear - 1, currentYear];

  // Fetch employees list (Admins only)
  const fetchEmployeesList = async () => {
    if (!isAdmin) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
        if (data.data.length > 0) {
          setSelectedEmpId(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching employees list:', err);
    }
  };

  // Fetch individual/personal monthly sheet
  const fetchMonthlySheet = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      let targetId = '';
      if (isAdmin && adminMode === 'individual') {
        targetId = selectedEmpId;
      } else {
        targetId = user._id;
      }

      if (!targetId) {
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${API_URL}/attendance/sheet?userId=${targetId}&month=${selectedMonth}&year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setSheetData(data);
      } else {
        setErrorMsg(data.message || 'Failed to retrieve attendance sheet');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin daily team status
  const fetchDailyTeamStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/attendance/daily-status?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setDailyStatusData(data);
      } else {
        setErrorMsg(data.message || 'Failed to retrieve daily team records');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEmployeesList();
    }
  }, []);

  useEffect(() => {
    if (isAdmin && (adminMode === 'dashboard' || adminMode === 'analytics')) {
      fetchDailyTeamStatus();
    } else {
      fetchMonthlySheet();
    }
  }, [adminMode, selectedMonth, selectedYear, selectedDate, selectedEmpId]);

  // Adjust month helper
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Date adjust helper for Daily status
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const getDaysInMonthGrid = () => {
    if (!sheetData) return [];
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const grid = [];
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    sheetData.days.forEach(day => {
      grid.push(day);
    });
    return grid;
  };

  // Status badge style mapping
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Late':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Half-day':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Absent':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Leave':
        return 'bg-violet-50 text-violet-700 border-violet-150';
      case 'Weekend':
        return 'bg-slate-50 text-slate-400 border-slate-100';
      case 'Scheduled':
        return 'bg-slate-50/50 text-slate-400/80 border-slate-100 border-dashed';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-150 border-dashed';
    }
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'Present':
        return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block"></span>;
      case 'Late':
        return <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block"></span>;
      case 'Half-day':
        return <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1 inline-block"></span>;
      case 'Absent':
        return <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 inline-block"></span>;
      case 'Leave':
        return <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-1 inline-block"></span>;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-slate-350 mr-1 inline-block"></span>;
    }
  };

  const getFilteredRecords = () => {
    if (!dailyStatusData) return [];
    return dailyStatusData.records.filter(rec => {
      const matchesSearch = rec.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            rec.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = !deptFilter || rec.user.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  };

  // Export Daily Roster Report to CSV
  const handleExportCSV = () => {
    const records = getFilteredRecords();
    if (records.length === 0) {
      showNotification('No records to export', 'error');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Clock In', 'Clock Out', 'Total Hours', 'Status', 'Date'];
    const rows = records.map(rec => [
      rec.user.employeeId || '',
      rec.user.name || '',
      rec.user.department || '',
      rec.user.designation || '',
      rec.details?.checkIn ? new Date(rec.details.checkIn).toLocaleTimeString() : '',
      rec.details?.checkOut ? new Date(rec.details.checkOut).toLocaleTimeString() : '',
      rec.details?.totalHours || 0,
      rec.status,
      selectedDate
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_report_${selectedDate}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Roster report exported successfully', 'success');
  };

  // Toast notifier helper
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'General'];

  // SVG Donut Slices Helper
  const getDonutChartSlices = () => {
    if (!dailyStatusData) return [];
    const { present, halfDay, absent, leave } = dailyStatusData.summary;
    const totalCount = present + halfDay + absent + leave;
    if (totalCount === 0) return [];

    const stats = [
      { label: 'Present', count: present, color: '#10b981' },
      { label: 'Half-day', count: halfDay, color: '#f97316' },
      { label: 'Absent', count: absent, color: '#ef4444' },
      { label: 'Leave', count: leave, color: '#8b5cf6' }
    ];

    const r = 50;
    const circ = 2 * Math.PI * r; // 314.16
    let accumulatedCirc = 0;

    return stats.map(stat => {
      const pct = (stat.count / totalCount) * 100;
      const strokeLength = (stat.count / totalCount) * circ;
      const strokeOffset = circ - strokeLength + accumulatedCirc;
      accumulatedCirc -= strokeLength;

      return {
        ...stat,
        pct: pct.toFixed(1),
        strokeLength,
        strokeOffset,
        circ
      };
    });
  };

  // Department Attendance rate computation (Dynamic)
  const getDepartmentStats = () => {
    if (!dailyStatusData) return [];
    
    // Group records by department
    const groups = {};
    dailyStatusData.records.forEach(rec => {
      const dept = rec.user.department || 'General';
      if (!groups[dept]) {
        groups[dept] = { total: 0, active: 0 };
      }
      groups[dept].total += 1;
      if (['Present', 'Half-day', 'Leave'].includes(rec.status)) {
        groups[dept].active += 1;
      }
    });

    return Object.entries(groups).map(([dept, count]) => {
      const rate = count.total > 0 ? (count.active / count.total) * 100 : 0;
      return {
        name: dept,
        rate: Math.round(rate),
        total: count.total,
        active: count.active
      };
    }).sort((a,b) => b.rate - a.rate);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Toast notifier */}
      {notification.show && (
        <div className={`fixed bottom-5 right-5 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold border shadow-2xl transition-all duration-300 z-50 animate-slideUp ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isAdmin ? 'Attendance & Analytics Console' : 'My Shift History'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin 
              ? 'Compile daily timesheets, view interactive SVG chart analytics, and export roster CSV sheets.' 
              : 'Review daily clock parameters, tracking logs and weekly summary stats.'}
          </p>
        </div>

        {/* Admin Navigation Modes Toggle */}
        {isAdmin && (
          <div className="bg-slate-100 p-1 rounded-xl flex self-start md:self-auto border border-slate-200 shadow-sm">
            <button
              onClick={() => setAdminMode('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                adminMode === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daily Dashboard
            </button>
            <button
              onClick={() => setAdminMode('analytics')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                adminMode === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Roster Analytics
            </button>
            <button
              onClick={() => setAdminMode('individual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                adminMode === 'individual'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Employee Calendars
            </button>
          </div>
        )}
      </div>

      {/* ERROR FEEDBACK */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-105 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ADMIN DAILY TEAM DASHBOARD MODE */}
      {/* ========================================================================= */}
      {isAdmin && adminMode === 'dashboard' && (
        <div className="space-y-8">
          
          {/* Dashboard Summary Widgets */}
          {dailyStatusData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Members</span>
                <span className="text-xl font-extrabold text-slate-800 mt-2 block">{dailyStatusData.summary.total}</span>
              </div>
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-105">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Present</span>
                <span className="text-xl font-extrabold text-emerald-950 mt-2 block">{dailyStatusData.summary.present}</span>
              </div>
              <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-105">
                <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">Half-day</span>
                <span className="text-xl font-extrabold text-orange-950 mt-2 block">{dailyStatusData.summary.halfDay}</span>
              </div>
              <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-105">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Absent</span>
                <span className="text-xl font-extrabold text-rose-950 mt-2 block">{dailyStatusData.summary.absent}</span>
              </div>
              <div className="bg-violet-50/60 p-4 rounded-2xl border border-violet-105">
                <span className="text-[10px] font-bold text-violet-850 uppercase tracking-wider block">On Leave</span>
                <span className="text-xl font-extrabold text-violet-950 mt-2 block">{dailyStatusData.summary.leave}</span>
              </div>
            </div>
          )}

          {/* Table list roster container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Table Controls (Date adjust, search, filters, CSV) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              
              {/* Roster date selection controls */}
              <div className="flex flex-wrap items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/30"
                />

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-755 text-xs font-bold rounded-xl transition-colors border border-indigo-100/50"
                  title="Export Roster List to CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Roster search/filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search field */}
                <div className="relative max-w-xs flex-1 sm:flex-none">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                {/* Department filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Filter className="w-3.5 h-3.5" />
                  </span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="block pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 bg-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Compiling Daily Rosters...</span>
              </div>
            ) : getFilteredRecords().length === 0 ? (
              <div className="h-64 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <UserX className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-sm font-semibold">No records found matching filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3.5 pl-2">Employee</th>
                      <th className="pb-3.5">Department</th>
                      <th className="pb-3.5">Clock In</th>
                      <th className="pb-3.5">Clock Out</th>
                      <th className="pb-3.5">Hours</th>
                      <th className="pb-3.5 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-55">
                    {getFilteredRecords().map((rec) => (
                      <tr key={rec.user._id} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-indigo-650 shrink-0">
                              {rec.user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 block truncate max-w-[150px] sm:max-w-none">{rec.user.name}</span>
                              <span className="text-[10px] text-slate-400 block">ID: {rec.user.employeeId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div>
                            <span className="font-semibold text-slate-800 block text-xs">{rec.user.department}</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{rec.user.designation}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-xs">
                          {rec.details?.checkIn ? (
                            new Date(rec.details.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-3.5 text-xs">
                          {rec.details?.checkOut ? (
                            new Date(rec.details.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : rec.details?.checkIn ? (
                            <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              On Duty
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-3.5 font-bold text-slate-850 text-xs">
                          {rec.details?.checkOut ? `${rec.details.totalHours} hrs` : '--'}
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN ATTENDANCE ANALYTICS MODE */}
      {/* ========================================================================= */}
      {isAdmin && adminMode === 'analytics' && (
        <div className="space-y-8 animate-fadeIn">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Generating Analytics Visualizations...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Pie/Donut Chart for Status Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-650" /> Daily Status Distribution
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                  {/* SVG Donut */}
                  <div className="relative w-44 h-44 shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      {/* Empty track placeholder */}
                      <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      
                      {/* Segment Slices */}
                      {getDonutChartSlices().map((slice, idx) => (
                        <circle
                          key={idx}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="12"
                          strokeDasharray={slice.circ}
                          strokeDashoffset={slice.strokeOffset}
                          strokeLinecap="round"
                          className="transition-all duration-500 ease-out"
                        />
                      ))}
                    </svg>
                    
                    {/* Inner metrics count overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-800">
                        {dailyStatusData ? dailyStatusData.summary.total : 0}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Members</span>
                    </div>
                  </div>

                  {/* Legend key list */}
                  <div className="space-y-3 font-semibold text-xs text-slate-600">
                    {getDonutChartSlices().map((slice, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: slice.color }}></span>
                        <div className="min-w-[80px]">
                          <span className="text-slate-850 block">{slice.label}</span>
                          <span className="text-[10px] text-slate-400 font-bold block">{slice.count} logged ({slice.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department Attendance Leaderboard */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-650" /> Departmental Attendance Rates
                </h3>

                <div className="space-y-4">
                  {getDepartmentStats().map((dept) => (
                    <div key={dept.name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{dept.name}</span>
                        <span className="text-indigo-650 font-bold">{dept.rate}% <span className="text-[10px] text-slate-400">({dept.active}/{dept.total})</span></span>
                      </div>
                      
                      {/* SVG Bar Track */}
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out bg-indigo-500"
                          style={{ width: `${dept.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EMPLOYEE CALENDAR OR ADMIN INDIVIDUAL CALENDAR MODE */}
      {/* ========================================================================= */}
      {(!isAdmin || adminMode === 'individual') && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Monthly Selection and view controls bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            
            {/* Left selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Employee selector dropdown for Admin */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employee:</span>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Month navigation controls */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white hover:shadow-sm text-slate-600 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                
                <span className="text-xs font-bold text-slate-800 px-3 min-w-[90px] text-center select-none">
                  {monthsList[selectedMonth - 1]} {selectedYear}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white hover:shadow-sm text-slate-600 rounded-lg transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick selectors drop list */}
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none"
                >
                  {monthsList.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m.substring(0, 3)}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggle Calendar vs Table List */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200/50">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'calendar' ? 'bg-white text-indigo-655 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Calendar view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-indigo-655 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table log list view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Retrieving Attendance Records...</span>
            </div>
          ) : !sheetData ? (
            <div className="h-64 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
              <CalendarDays className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-sm font-semibold">Failed to build monthly calendar. Re-select months.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Statistical cards */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute right-2 top-2 opacity-10 text-indigo-705">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Attendance Rate</span>
                    <h4 className="text-xl font-extrabold text-indigo-900 mt-1">
                      {sheetData.stats.percentage}%
                    </h4>
                  </div>
                  <span className="text-[10px] text-indigo-650/80 mt-3 block">Ratio of active days</span>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Present</span>
                  <h4 className="text-xl font-extrabold text-emerald-900 mt-1">
                    {sheetData.stats.present} <span className="text-xs font-semibold text-emerald-705">days</span>
                  </h4>
                  <span className="text-[10px] text-emerald-650/70 mt-3 block">Full credits logged</span>
                </div>

                <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-orange-855 uppercase tracking-wider block">Half Days</span>
                  <h4 className="text-xl font-extrabold text-orange-950 mt-1">
                    {sheetData.stats.halfDay} <span className="text-xs font-semibold text-orange-705">days</span>
                  </h4>
                  <span className="text-[10px] text-orange-700/70 mt-3 block">Under 4 hrs work shifts</span>
                </div>

                <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Absent</span>
                  <h4 className="text-xl font-extrabold text-rose-900 mt-1">
                    {sheetData.stats.absent} <span className="text-xs font-semibold text-rose-705">days</span>
                  </h4>
                  <span className="text-[10px] text-rose-700/70 mt-3 block">Missing clock schedules</span>
                </div>

                <div className="bg-violet-50/50 rounded-2xl border border-violet-100 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-violet-850 uppercase tracking-wider block">Approved Leaves</span>
                  <h4 className="text-xl font-extrabold text-violet-950 mt-1">
                    {sheetData.stats.leave} <span className="text-xs font-semibold text-violet-750">days</span>
                  </h4>
                  <span className="text-[10px] text-violet-700/75 mt-3 block">Paid or Sick breaks</span>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-205 p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Rest Days</span>
                  <h4 className="text-xl font-extrabold text-slate-800 mt-1">
                    {sheetData.stats.weekend} <span className="text-xs font-semibold text-slate-500">days</span>
                  </h4>
                  <span className="text-[10px] text-slate-450 mt-3 block">Rest cycle / Sat & Sun</span>
                </div>
              </div>

              {/* Grid content and layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                
                {/* CALENDAR VIEW GRID */}
                {viewMode === 'calendar' ? (
                  <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-800 text-sm">Monthly Grid</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center">{getStatusIndicator('Present')} Present</span>
                        <span className="flex items-center">{getStatusIndicator('Half-day')} Half-day</span>
                        <span className="flex items-center">{getStatusIndicator('Absent')} Absent</span>
                        <span className="flex items-center">{getStatusIndicator('Leave')} Leave</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2.5">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                        <div key={dayName} className="text-center font-bold text-slate-400 text-[10px] py-1 uppercase tracking-wide">
                          {dayName}
                        </div>
                      ))}

                      {getDaysInMonthGrid().map((dayObj, index) => {
                        if (dayObj === null) {
                          return <div key={`empty-${index}`} className="aspect-square bg-slate-50/20 rounded-xl"></div>;
                        }

                        return (
                          <div
                            key={dayObj.dateString}
                            className={`aspect-square p-2.5 rounded-xl border flex flex-col justify-between hover:scale-[1.03] transition-all duration-200 relative group cursor-pointer ${getStatusStyle(dayObj.status)}`}
                          >
                            <span className="font-bold text-xs select-none">{dayObj.day}</span>
                            
                            <div className="flex flex-col items-start gap-1">
                              {dayObj.status === 'Present' && (
                                <span className="text-[9px] font-bold tracking-wide hidden sm:block">Present</span>
                              )}
                              {dayObj.status === 'Late' && (
                                <span className="text-[9px] font-bold tracking-wide hidden sm:block">Late Checkin</span>
                              )}
                              {dayObj.status === 'Half-day' && (
                                <span className="text-[9px] font-bold tracking-wide hidden sm:block font-mono">Half Day</span>
                              )}
                              {dayObj.status === 'Leave' && (
                                <span className="text-[9px] font-bold tracking-wide hidden sm:block">Leave Day</span>
                              )}
                              {dayObj.status === 'Absent' && (
                                <span className="text-[9px] font-bold tracking-wide hidden sm:block">Absent</span>
                              )}
                            </div>

                            {dayObj.details && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white rounded-lg p-2.5 text-[10px] space-y-1.5 shadow-xl z-20 w-44 font-semibold">
                                <p className="border-b border-white/10 pb-1 text-indigo-400 font-bold uppercase tracking-wider">Shift Logs</p>
                                <p>Clock-In: {new Date(dayObj.details.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                {dayObj.details.checkOut ? (
                                  <>
                                    <p>Clock-Out: {new Date(dayObj.details.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-emerald-400 font-bold">Total: {dayObj.details.totalHours} hrs worked</p>
                                  </>
                                ) : (
                                  <p className="text-amber-400 font-bold">Shift actively running</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // TABLE VIEW LIST
                  <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Shift Log List</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-150 text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="pb-3.5 pl-2">Date</th>
                            <th className="pb-3.5">Clock In</th>
                            <th className="pb-3.5">Clock Out</th>
                            <th className="pb-3.5">Total Hours</th>
                            <th className="pb-3.5 pr-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-55">
                          {sheetData.days
                            .filter(day => ['Present', 'Late', 'Half-day', 'Leave', 'Absent'].includes(day.status))
                            .map((day) => (
                              <tr key={day.dateString} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                                <td className="py-3 pl-2 font-bold text-slate-800">
                                  {new Date(day.dateString).toLocaleDateString([], {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </td>
                                <td className="py-3 font-medium">
                                  {day.details?.checkIn ? (
                                    new Date(day.details.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  ) : (
                                    <span className="text-slate-400">--</span>
                                  )}
                                </td>
                                <td className="py-3 font-medium">
                                  {day.details?.checkOut ? (
                                    new Date(day.details.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  ) : day.details?.checkIn ? (
                                    <span className="text-amber-600 font-bold text-[9px] bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                      Active Shift
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">--</span>
                                  )}
                                </td>
                                <td className="py-3 font-bold text-slate-800">
                                  {day.details?.checkOut ? `${day.details.totalHours} hrs` : '--'}
                                </td>
                                <td className="py-3 pr-2">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(day.status)}`}>
                                    {day.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* WEEKLY STAT BREAKOUT SIDEBAR */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-500" /> Weekly Distribution
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(sheetData.weeklyStats).map(([weekName, weekStat]) => (
                      <div key={weekName} className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-2">
                        <span className="text-xs font-bold text-slate-700 block border-b border-slate-150 pb-1">{weekName}</span>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                          <div>
                            <span>Present: </span>
                            <span className="text-emerald-600">{weekStat.present}d</span>
                          </div>
                          <div>
                            <span>Half Days: </span>
                            <span className="text-orange-655">{weekStat.halfDay}d</span>
                          </div>
                          <div>
                            <span>Absent: </span>
                            <span className="text-rose-600">{weekStat.absent}d</span>
                          </div>
                          <div>
                            <span>Leaves: </span>
                            <span className="text-violet-600">{weekStat.leave}d</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Attendance;
