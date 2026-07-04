import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  Check, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MessageSquare, 
  CalendarDays,
  Clock,
  UserCheck,
  UserX,
  FileCheck2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Leaves = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  // Leave Form state (Employee)
  const [leaveType, setLeaveType] = useState('Paid'); // 'Paid' | 'Sick' | 'Unpaid'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Admin Processing Dialog state
  const [showActionModal, setShowActionModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null); // { id: '...', status: 'Approved' | 'Rejected', name: '...' }
  const [adminComments, setAdminComments] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isAdmin ? '/leaves/all' : '/leaves/my-leaves';
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch leaves logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date cannot exceed end date');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ leaveType, startDate, endDate, reason })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Leave application submitted successfully', 'success');
        setStartDate('');
        setEndDate('');
        setReason('');
        await fetchLeaves();
      } else {
        setErrorMsg(data.message || 'Submission failed');
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionDialog = (id, status, employeeName) => {
    setActiveRequest({ id, status, employeeName });
    setAdminComments('');
    setShowActionModal(true);
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!activeRequest) return;

    const { id, status } = activeRequest;
    setActioningId(id);
    setShowActionModal(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/leaves/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminComments })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Leave application ${status.toLowerCase()} successfully`, 'success');
        await fetchLeaves();
      } else {
        showNotification(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      showNotification('Network connection error', 'error');
    } finally {
      setActioningId(null);
      setActiveRequest(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-amber-50 text-amber-705 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-10 h-10 text-indigo-650 animate-spin" />
        <span className="text-xs text-slate-450 font-semibold">Loading Leaves Workspace...</span>
      </div>
    );
  }

  // Calculate stats for employees
  const approvedLeaves = leaves.filter(l => l.status === 'Approved');
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Toast notifications */}
      {notification.show && (
        <div className={`fixed bottom-5 right-5 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold border shadow-2xl transition-all duration-300 z-50 animate-slideUp ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-650" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Time Off & Leaves</h2>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin 
            ? 'Compile leave submissions, write authorization comments, and process time-off files.' 
            : 'Apply for time off, monitor active requests and review corporate approvals.'}
        </p>
      </div>

      {/* Statistics Header row for Employee */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Applied</span>
              <span className="text-lg font-bold text-slate-855 mt-0.5 block">{leaves.length} Applications</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved Leaves</span>
              <span className="text-lg font-bold text-emerald-755 mt-0.5 block">{approvedLeaves.length} Approved</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
              <span className="text-lg font-bold text-amber-755 mt-0.5 block">{pendingLeaves.length} Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Main layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Form Column (Left 1 col, only for employee) */}
        {!isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 self-start">
            <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100">Apply for Time Off</h3>
            
            {errorMsg && (
              <div className="flex items-center gap-2 bg-rose-50 text-rose-750 p-3.5 rounded-xl text-xs border border-rose-100">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              {/* Type Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                >
                  <option value="Paid">Paid Leave (Annual/Casual)</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leave (LWP)</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  required
                />
              </div>

              {/* Remarks/Reason */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks / Reason</label>
                <textarea
                  placeholder="Provide details about your time off request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 transition-all duration-200 resize-none h-24 font-semibold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-650/15 disabled:opacity-50"
              >
                {submitting ? 'Submitting request...' : 'Send Application'}
              </button>
            </form>
          </div>
        )}

        {/* History Log Column (Right 2 cols / Full width for Admin) */}
        <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Leave Records</h3>
            <span className="text-xs font-semibold bg-slate-100 text-slate-655 px-2.5 py-1 rounded-full">
              {leaves.length} Items Found
            </span>
          </div>

          {leaves.length === 0 ? (
            <div className="h-72 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
              <FileCheck2 className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-semibold">No leaves logged in history.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    {isAdmin && <th className="pb-3.5 pl-2">Employee</th>}
                    <th className="pb-3.5">Leave Type</th>
                    <th className="pb-3.5">Duration</th>
                    <th className="pb-3.5">Remarks</th>
                    <th className="pb-3.5">Status</th>
                    {isAdmin && <th className="pb-3.5 pr-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-55">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                      {/* Admin View employee detail */}
                      {isAdmin && (
                        <td className="py-3.5 pl-2">
                          <div>
                            <span className="font-semibold text-slate-800 block truncate max-w-[130px]">{leave.userId ? leave.userId.name : 'Unknown User'}</span>
                            <span className="text-[10px] text-slate-400 block">{leave.userId ? leave.userId.department : 'N/A'}</span>
                          </div>
                        </td>
                      )}

                      {/* Leave Type */}
                      <td className="py-3.5">
                        <span className="font-semibold text-slate-800 text-xs">{leave.leaveType}</span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-750">
                            {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] text-slate-400 block italic">
                            ({Math.round((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1} day(s))
                          </span>
                        </div>
                      </td>

                      {/* Remarks (Reason) */}
                      <td className="py-3.5 text-xs max-w-xs">
                        <div className="space-y-1">
                          <span className="text-slate-500 font-semibold block truncate" title={leave.reason}>{leave.reason}</span>
                          {/* Render HR Admin Comments if present */}
                          {leave.adminComments && (
                            <span className="text-[10px] text-indigo-650 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                              <MessageSquare className="w-3 h-3 shrink-0" />
                              <span>HR: {leave.adminComments}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>

                      {/* Admin action triggers */}
                      {isAdmin && (
                        <td className="py-3.5 pr-2 text-right">
                          {leave.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openActionDialog(leave._id, 'Approved', leave.userId?.name || 'Employee')}
                                disabled={actioningId === leave._id}
                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                title="Approve Leave"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openActionDialog(leave._id, 'Rejected', leave.userId?.name || 'Employee')}
                                disabled={actioningId === leave._id}
                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors"
                                title="Reject Leave"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADMIN ACTION DIALOG (Comments prompt modal) */}
      {/* ========================================================================= */}
      {showActionModal && activeRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-5 animate-slideUp">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  {activeRequest.status === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h3>
                <p className="text-xs text-slate-450 mt-1">
                  Processing time off request for <span className="font-bold text-slate-700">{activeRequest.employeeName}</span>.
                </p>
              </div>
              <button 
                onClick={() => setShowActionModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleStatusChange} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Admin Comments / Remarks
                </label>
                <textarea
                  placeholder="e.g. Approved. Please hand over active sprint tickets to team lead."
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850 h-24 resize-none font-semibold"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md ${
                    activeRequest.status === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                  }`}
                >
                  {activeRequest.status === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
