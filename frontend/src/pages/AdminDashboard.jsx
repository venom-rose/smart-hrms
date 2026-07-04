import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, 
  Clock, 
  CalendarDays, 
  Smile, 
  Check, 
  X, 
  UserCircle, 
  Briefcase, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Switching context employee state (View-As / Impersonate)
  const [focusedEmployee, setFocusedEmployee] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [empRes, attRes, leaveRes] = await Promise.all([
        fetch(`${API_URL}/employees`, { headers }),
        fetch(`${API_URL}/attendance/all`, { headers }),
        fetch(`${API_URL}/leaves/all`, { headers })
      ]);

      const empData = await empRes.json();
      const attData = await attRes.json();
      const leaveData = await leaveRes.json();

      if (empData.success) setEmployees(empData.data);
      if (attData.success) setAttendance(attData.data);
      if (leaveData.success) setLeaves(leaveData.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLeaveAction = async (id, status) => {
    setActioningId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Leave application ${status.toLowerCase()} successfully`, 'success');
        await fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to update leave status', 'error');
      }
    } catch (err) {
      showToast('Network error occurred', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Switch focused employee handler
  const handleSwitchEmployee = (employeeId) => {
    if (employeeId === '') {
      setFocusedEmployee(null);
    } else {
      const found = employees.find(e => e._id === employeeId);
      setFocusedEmployee(found || null);
    }
  };

  // Filtered stats for focused employee
  const focusedAttendance = focusedEmployee 
    ? attendance.filter(a => a.userId && a.userId._id === focusedEmployee._id)
    : [];

  const focusedLeaves = focusedEmployee
    ? leaves.filter(l => l.userId && l.userId._id === focusedEmployee._id)
    : [];

  // Chart refs and instances
  const attendanceChartRef = useRef(null);
  const leavesChartRef = useRef(null);
  const attendanceChartInst = useRef(null);
  const leavesChartInst = useRef(null);

  const getLast7DaysStats = () => {
    const stats = [];
    const totalEmp = employees.length || 1;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const presentCount = attendance.filter(a => a.dateString === dateStr).length;
      const pct = Math.min(100, Math.round((presentCount / totalEmp) * 100));
      
      stats.push({
        label: d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        percentage: pct
      });
    }
    return stats;
  };

  const getLeaveDistribution = () => {
    const counts = { Paid: 0, Sick: 0, Unpaid: 0 };
    leaves.forEach(l => {
      if (l.leaveType && counts[l.leaveType] !== undefined && l.status !== 'Rejected') {
        counts[l.leaveType] += 1;
      }
    });
    return counts;
  };

  useEffect(() => {
    if (loading || employees.length === 0) return;

    if (attendanceChartInst.current) {
      attendanceChartInst.current.destroy();
    }
    if (leavesChartInst.current) {
      leavesChartInst.current.destroy();
    }

    const attData = getLast7DaysStats();
    if (attendanceChartRef.current) {
      const ctx = attendanceChartRef.current.getContext('2d');
      attendanceChartInst.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: attData.map(d => d.label),
          datasets: [{
            label: 'Attendance Rate',
            data: attData.map(d => d.percentage),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: {
                callback: (value) => `${value}%`
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    const leaveData = getLeaveDistribution();
    if (leavesChartRef.current) {
      const ctx = leavesChartRef.current.getContext('2d');
      leavesChartInst.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Paid Leaves', 'Sick Leaves', 'Unpaid Leaves'],
          datasets: [{
            data: [leaveData.Paid, leaveData.Sick, leaveData.Unpaid],
            backgroundColor: ['#8b5cf6', '#ef4444', '#f97316'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 10 }
              }
            }
          }
        }
      });
    }

    return () => {
      if (attendanceChartInst.current) {
        attendanceChartInst.current.destroy();
      }
      if (leavesChartInst.current) {
        leavesChartInst.current.destroy();
      }
    };
  }, [loading, employees, attendance, leaves]);

  // General company statistics
  const totalEmployeesCount = employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const presentTodayCount = attendance.filter(a => a.dateString === todayStr).length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const pendingLeavesCount = pendingLeaves.length;

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-650 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Alert */}
      {notification.show && (
        <div className={`fixed bottom-5 right-5 flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border shadow-lg z-50 animate-slideUp ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header and Switch selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Console</h2>
          <p className="text-slate-500 text-sm mt-1">
            {focusedEmployee 
              ? `Currently reviewing details for employee space ${focusedEmployee.name}`
              : 'Enterprise status indicators and roster actions.'}
          </p>
        </div>
        
        {/* Switched Employees Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Review Space:</label>
          <select
            value={focusedEmployee ? focusedEmployee._id : ''}
            onChange={(e) => handleSwitchEmployee(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Employees (Company View)</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RENDER FOCUS MODE: Focused Employee space details */}
      {focusedEmployee ? (
        <div className="space-y-8">
          
          {/* Back button link */}
          <button
            onClick={() => setFocusedEmployee(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-650 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Company Overview
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Employee Profile Space card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100 flex items-center gap-1.5">
                <UserCircle className="w-5 h-5 text-slate-400" />
                Employment Profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Full Name</span>
                  <span className="font-bold text-slate-850 text-sm mt-0.5 block">{focusedEmployee.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Employee ID: {focusedEmployee.employeeId}</span>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Credentials</span>
                  <span className="text-xs font-medium text-slate-700 mt-0.5 block">{focusedEmployee.email}</span>
                  <span className="text-xs text-slate-500 font-medium">{focusedEmployee.contact || 'No contact listed'}</span>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Designation & Team</span>
                  <span className="text-xs font-semibold text-slate-800 block mt-0.5">{focusedEmployee.designation}</span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                    {focusedEmployee.department}
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Annual salary compensation</span>
                  <span className="font-bold text-indigo-650 text-sm mt-0.5 block">
                    ${focusedEmployee.salary?.toLocaleString() || '30,000'} / year
                  </span>
                </div>

                {focusedEmployee.skills && focusedEmployee.skills.length > 0 && (
                  <div>
                    <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Skill Matrix</span>
                    <div className="flex flex-wrap gap-1.5">
                      {focusedEmployee.skills.map(s => (
                        <span key={s} className="text-[10px] bg-slate-50 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Detailed logs tab (Attendance & Leaves) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Focused User Attendance Logs */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-base pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Shift Log Details</span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-50 border px-2 py-0.5 rounded">
                    {focusedAttendance.length} records
                  </span>
                </h3>

                {focusedAttendance.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No attendance logs logged for this employee.</p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                    {focusedAttendance.map(log => (
                      <div key={log._id} className="p-3 border border-slate-50 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {new Date(log.checkIn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Clocked: {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active Shift'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 block">{log.checkOut ? `${log.totalHours} hrs` : '--'}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block mt-1 ${
                            log.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Focused User Leaves Logs */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-base pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Leave History Details</span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-50 border px-2 py-0.5 rounded">
                    {focusedLeaves.length} requests
                  </span>
                </h3>

                {focusedLeaves.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No leave applications registered.</p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                    {focusedLeaves.map(leave => (
                      <div key={leave._id} className="p-3 border border-slate-50 rounded-xl bg-slate-50/50 flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-850">{leave.leaveType} Leave</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : leave.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[10px]">
                          Dates: {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} to{' '}
                          {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-slate-500 leading-normal italic bg-white p-2 border border-slate-100 rounded">
                          "{leave.reason}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      ) : (
        /* OVERVIEW MODE: Show stats + approvals + employee list + attendance list */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Stats Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-650">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Staff Strength</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{totalEmployeesCount}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Present Shift Today</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{presentTodayCount}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-50 rounded-xl text-sky-650">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Pending Off Requests</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-0.5 block">{pendingLeavesCount}</span>
              </div>
            </div>
          </div>

          {/* Charts Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Company Attendance Rate (Last 7 Days)</h3>
              <div className="h-64 relative">
                <canvas ref={attendanceChartRef} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Leave Type Distribution</h3>
              <div className="h-64 relative flex items-center justify-center">
                <div className="w-56 h-56">
                  <canvas ref={leavesChartRef} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Employee List & Leaves approval */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Employee List table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">Corporate Staff Directory</h3>
                  <span className="text-xs font-medium text-slate-400">Click Space to view individual details</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Name</th>
                        <th className="pb-3">Designation</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-55">
                      {employees.map(emp => (
                        <tr key={emp._id} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 pl-2 font-semibold text-slate-800">{emp.name}</td>
                          <td className="py-3 font-medium">{emp.designation}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-slate-50 border rounded text-[10px] font-semibold text-slate-500">
                              {emp.department}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-2">
                            <button
                              onClick={() => setFocusedEmployee(emp)}
                              className="text-[10px] font-bold text-indigo-650 hover:text-indigo-800 hover:underline transition-colors"
                            >
                              View Space
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leave approvals console */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Leave Requests Approval Console</h3>
                  <p className="text-xs text-slate-400 mt-1">Review pending leave applications submitted by employee staff.</p>
                </div>

                {pendingLeavesCount === 0 ? (
                  <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                    No pending leave requests left to approve. All up to date!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingLeaves.map(leave => (
                      <div key={leave._id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-slate-300 transition-all duration-200">
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{leave.userId ? leave.userId.name : 'Unknown User'}</span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                              {leave.leaveType}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Required duration: {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} to{' '}
                            {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-slate-500 italic bg-white p-2 border border-slate-50 rounded">
                            "{leave.reason}"
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => handleLeaveAction(leave._id, 'Approved')}
                            disabled={actioningId === leave._id}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-150 font-bold text-[10px] transition-colors flex items-center gap-0.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                            disabled={actioningId === leave._id}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-150 font-bold text-[10px] transition-colors flex items-center gap-0.5"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Col: Recent Attendance log stream */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 self-start">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Recent Shift logs</h3>
                <p className="text-xs text-slate-400 mt-1">Live feed of daily employee clock-in and out timestamps.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {attendance.slice(0, 10).map((log) => (
                  <div key={log._id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-2 hover:border-slate-200 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">
                          {log.userId ? log.userId.name : 'Unknown User'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {log.userId ? log.userId.designation : 'N/A'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                        log.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-100/50 flex justify-between items-center">
                      <span>
                        In: {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>
                        Out: {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {log.checkOut ? `${log.totalHours} hrs` : 'Active'}
                      </span>
                    </div>
                  </div>
                ))}

                {attendance.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">No shift logs logged today.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
