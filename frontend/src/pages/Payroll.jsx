import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wallet, 
  Plus, 
  Coins, 
  Download, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  CreditCard,
  Search,
  Filter,
  Edit,
  X,
  Building2,
  Sliders,
  Award
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Payroll = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Admin View mode: 'payslips' (issue & logs) or 'structures' (manage base salary structure)
  const [adminMode, setAdminMode] = useState('payslips');

  const [payrollLogs, setPayrollLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Form state - Issue Payslip (Admin)
  const [selectedUserId, setSelectedUserId] = useState('');
  const [month, setMonth] = useState('July');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [allowancesInput, setAllowancesInput] = useState('2000'); // treated as monthly bonus
  const [deductionsInput, setDeductionsInput] = useState('800'); // treated as monthly deductions
  const [status, setStatus] = useState('Paid');

  // Modal State - Adjust Salary Structure (Admin)
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null); // employee being edited
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');
  const [savingStructure, setSavingStructure] = useState(false);

  // Filters for Admin list
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch monthly payslips list
      const endpoint = isAdmin ? '/payroll/all' : '/payroll/my-payroll';
      const logRes = await fetch(`${API_URL}${endpoint}`, { headers });
      const logData = await logRes.json();
      if (logData.success) {
        setPayrollLogs(logData.data);
      }

      // Fetch employees list (Admins only)
      if (isAdmin) {
        const empRes = await fetch(`${API_URL}/employees`, { headers });
        const empData = await empRes.json();
        if (empData.success) {
          setEmployees(empData.data);
          if (empData.data.length > 0 && !selectedUserId) {
            setSelectedUserId(empData.data[0]._id);
          }
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to retrieve payroll data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handler: Generate monthly payslip
  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !month || !year) {
      setErrorMsg('Please select employee, month, and year');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/payroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserId,
          month,
          year,
          allowances: Number(allowancesInput),
          deductions: Number(deductionsInput),
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Payslip generated for ${month} ${year}`, 'success');
        setAllowancesInput('2000');
        setDeductionsInput('800');
        await fetchData();
      } else {
        setErrorMsg(data.message || 'Generation failed');
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Open edit structure modal
  const openStructureDialog = (emp) => {
    setSelectedEmp(emp);
    setBaseSalary(emp.salary?.toString() || '30000');
    setBonus(emp.allowances?.toString() || '0');
    setDeductions(emp.deductions?.toString() || '0');
    setShowStructureModal(true);
  };

  // Handler: Save adjustments to salary structure (base, bonus, deductions)
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    setSavingStructure(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/employees/${selectedEmp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          salary: Number(baseSalary),
          allowances: Number(bonus),
          deductions: Number(deductions)
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Salary structure for ${selectedEmp.name} updated successfully`, 'success');
        setShowStructureModal(false);
        // Refresh employee database list
        await fetchData();
      } else {
        showNotification(data.message || 'Failed to update structure', 'error');
      }
    } catch (err) {
      showNotification('Network connection error', 'error');
    } finally {
      setSavingStructure(false);
      setSelectedEmp(null);
    }
  };

  // Filter employees for Admin structures grid
  const getFilteredEmployees = () => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = !deptFilter || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  };

  // Export payroll statements history (Admin)
  const handleExportPayslipsCSV = () => {
    if (payrollLogs.length === 0) {
      showNotification('No issued statements to export', 'error');
      return;
    }

    const headers = ['Employee Name', 'Department', 'Designation', 'Period', 'Base Salary', 'Bonus', 'Deductions', 'Net Salary', 'Status'];
    const rows = payrollLogs.map(log => [
      log.userId ? log.userId.name : 'Unknown User',
      log.userId ? log.userId.department : '',
      log.userId ? log.userId.designation : '',
      `${log.month} ${log.year}`,
      log.basicSalary || 0,
      log.allowances || 0,
      log.deductions || 0,
      log.netSalary || 0,
      log.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payroll_payslips_report.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Payslip statement ledger report exported', 'success');
  };

  // Export salary structures registry (Admin)
  const handleExportStructuresCSV = () => {
    const targetData = getFilteredEmployees();
    if (targetData.length === 0) {
      showNotification('No structures to export', 'error');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Base Salary', 'Bonus (Annual)', 'Deductions (Annual)', 'Net Annual'];
    const rows = targetData.map(emp => [
      emp.employeeId || '',
      emp.name || '',
      emp.department || '',
      emp.designation || '',
      emp.salary || 0,
      emp.allowances || 0,
      emp.deductions || 0,
      (emp.salary || 0) + (emp.allowances || 0) - (emp.deductions || 0)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'salary_structures_report.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Salary structures report exported', 'success');
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'General'];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-10 h-10 text-indigo-650 animate-spin" />
        <span className="text-xs text-slate-450 font-semibold">Loading Payroll Workspace...</span>
      </div>
    );
  }

  // Employee: Calculate estimated net take-home
  const empBase = user?.salary || 30000;
  const empBonus = user?.allowances || 0; // allowance maps to bonus
  const empDeductions = user?.deductions || 0;
  const empNetAnnual = empBase + empBonus - empDeductions;
  const empNetMonthly = empNetAnnual / 12;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Toast notifications */}
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Compensation & Payroll</h2>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin 
              ? 'Distribute monthly paychecks and modify core salary structure configurations.' 
              : 'Review your salary structure breakdown and download monthly slips.'}
          </p>
        </div>

        {/* Admin Navigation Options Toggle */}
        {isAdmin && (
          <div className="bg-slate-100 p-1 rounded-xl flex self-start md:self-auto border border-slate-200 shadow-sm">
            <button
              onClick={() => setAdminMode('payslips')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                adminMode === 'payslips'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-855'
              }`}
            >
              Payslips Dashboard
            </button>
            <button
              onClick={() => setAdminMode('structures')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                adminMode === 'structures'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-855'
              }`}
            >
              Salary Structures
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EMPLOYEE PORTAL VIEW */}
      {/* ========================================================================= */}
      {!isAdmin && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Read-Only Salary Structure Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {/* Base Salary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Salary (Annual)</span>
                <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">${empBase.toLocaleString()}</span>
              </div>
            </div>

            {/* Bonus */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bonus (Annual)</span>
                <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">${empBonus.toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deductions (Annual)</span>
                <span className="text-lg font-extrabold text-rose-700 mt-0.5 block">-${empDeductions.toLocaleString()}</span>
              </div>
            </div>

            {/* Projected Net Take-Home */}
            <div className="bg-gradient-to-r from-indigo-650 to-indigo-700 p-5 rounded-2xl text-white shadow-md flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-2 top-2 opacity-15">
                <TrendingUp className="w-12 h-12" />
              </div>
              <div className="p-3 bg-white/10 text-white rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
              <div className="z-10">
                <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider block">Net Take-Home (Est.)</span>
                <span className="text-lg font-extrabold text-white mt-0.5 block">${empNetAnnual.toLocaleString()}/yr</span>
                <span className="text-[9px] text-indigo-150 block mt-0.5">Approx: ${Math.round(empNetMonthly).toLocaleString()}/mo</span>
              </div>
            </div>
          </div>

          {/* Historical statements list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100">Historical Payslips</h3>
            
            {payrollLogs.length === 0 ? (
              <div className="h-64 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <Receipt className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-sm font-semibold">No payslip statements issued yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3.5 pl-2">Statement Period</th>
                      <th className="pb-3.5">Base Salary ($)</th>
                      <th className="pb-3.5">Bonus ($)</th>
                      <th className="pb-3.5">Deductions ($)</th>
                      <th className="pb-3.5 font-bold text-slate-800">Net Take-Home ($)</th>
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5 pr-2 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-55">
                    {payrollLogs.map((log) => (
                      <tr key={log._id} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-slate-850">{log.month} {log.year}</td>
                        <td className="py-3.5">{(log.basicSalary || 0).toLocaleString()}</td>
                        <td className="py-3.5 text-emerald-600">+{ (log.allowances || 0).toLocaleString()}</td>
                        <td className="py-3.5 text-rose-605">-{ (log.deductions || 0).toLocaleString()}</td>
                        <td className="py-3.5 font-bold text-indigo-650">{ (log.netSalary || 0).toLocaleString()}</td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                            log.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            onClick={() => showNotification(`Payslip statement for ${log.month} ${log.year} downloaded`, 'success')}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded border border-slate-150 transition-colors"
                            title="Download PDF slips"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
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
      {/* ADMIN WORKSPACE VIEWS */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* VIEW A: PAYSLIPS DIRECTORY & GENERATOR */}
          {adminMode === 'payslips' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Slip Generator form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 self-start">
                <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100">Issue Monthly Payslip</h3>
                
                {errorMsg && (
                  <div className="flex items-center gap-2 bg-rose-50 text-rose-750 p-3 rounded-lg text-xs border border-rose-100 animate-slideUp">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleGeneratePayroll} className="space-y-4">
                  {/* Select Employee */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Employee</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                    >
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.designation})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Period Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Month</label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                      >
                        {months.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Year</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Bonus & Deductions inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bonus ($)</label>
                      <input
                        type="number"
                        value={allowancesInput}
                        onChange={(e) => setAllowancesInput(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Deductions ($)</label>
                      <input
                        type="number"
                        value={deductionsInput}
                        onChange={(e) => setDeductionsInput(e.target.value)}
                        className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Initial status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-650/15 disabled:opacity-50"
                  >
                    {submitting ? 'Generating paycheck...' : 'Issue Paycheck'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base">Payslip Logs</h3>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-655 px-2.5 py-1 rounded-full">
                      {payrollLogs.length} Records Found
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportPayslipsCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors border border-indigo-100/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {payrollLogs.length === 0 ? (
                  <div className="h-64 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                    <Receipt className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-sm font-semibold">No payroll sheets issued yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                          <th className="pb-3.5 pl-2">Employee</th>
                          <th className="pb-3.5">Period</th>
                          <th className="pb-3.5">Base Salary ($)</th>
                          <th className="pb-3.5">Bonus ($)</th>
                          <th className="pb-3.5">Deductions ($)</th>
                          <th className="pb-3.5 font-bold text-slate-800">Net ($)</th>
                          <th className="pb-3.5 pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-55">
                        {payrollLogs.map((log) => (
                          <tr key={log._id} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                            <td className="py-3.5 pl-2">
                              <div>
                                <span className="font-semibold text-slate-800 block truncate max-w-[130px]">{log.userId ? log.userId.name : 'Unknown User'}</span>
                                <span className="text-[10px] text-slate-400 block">{log.userId ? log.userId.designation : 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 font-medium">{log.month} {log.year}</td>
                            <td className="py-3.5">{(log.basicSalary || 0).toLocaleString()}</td>
                            <td className="py-3.5 text-emerald-600">+{ (log.allowances || 0).toLocaleString()}</td>
                            <td className="py-3.5 text-rose-600">-{ (log.deductions || 0).toLocaleString()}</td>
                            <td className="py-3.5 font-bold text-indigo-650">{ (log.netSalary || 0).toLocaleString()}</td>
                            <td className="py-3.5 pr-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                log.status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {log.status}
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

          {/* VIEW B: MANAGE SALARY STRUCTURES */}
          {adminMode === 'structures' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              {/* Filters Header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-slate-800 text-base">Salary Structure Registry</h3>
                  <button
                    type="button"
                    onClick={handleExportStructuresCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors border border-indigo-100/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative max-w-xs">
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

                  {/* Filter Dept */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Filter className="w-3.5 h-3.5" />
                    </span>
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="block pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 bg-white"
                    >
                      <option value="">All Departments</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Structures Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3.5 pl-2">Employee</th>
                      <th className="pb-3.5">Department</th>
                      <th className="pb-3.5">Base Salary ($)</th>
                      <th className="pb-3.5">Bonus (Annual) ($)</th>
                      <th className="pb-3.5">Deductions (Annual) ($)</th>
                      <th className="pb-3.5 font-bold text-slate-800">Net Annual ($)</th>
                      <th className="pb-3.5 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-55">
                    {getFilteredEmployees().map((emp) => {
                      const netAnnual = (emp.salary || 30000) + (emp.allowances || 0) - (emp.deductions || 0);
                      
                      return (
                        <tr key={emp._id} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-indigo-650 shrink-0">
                                {emp.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800 block">{emp.name}</span>
                                <span className="text-[10px] text-slate-400">ID: {emp.employeeId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div>
                              <span className="font-semibold text-slate-850 block text-xs">{emp.department}</span>
                              <span className="text-[10px] text-slate-400">{emp.designation}</span>
                            </div>
                          </td>
                          <td className="py-3.5 font-medium">{(emp.salary || 0).toLocaleString()}</td>
                          <td className="py-3.5 text-emerald-650">+{ (emp.allowances || 0).toLocaleString()}</td>
                          <td className="py-3.5 text-rose-650">-{ (emp.deductions || 0).toLocaleString()}</td>
                          <td className="py-3.5 font-extrabold text-indigo-650">{netAnnual.toLocaleString()}</td>
                          <td className="py-3.5 pr-2 text-right">
                            <button
                              onClick={() => openStructureDialog(emp)}
                              className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-150 hover:border-indigo-200 rounded-lg transition-all"
                              title="Update salary structure"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN ADJUST STRUCTURE DIALOG (Modal overlay) */}
      {/* ========================================================================= */}
      {showStructureModal && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-5 animate-slideUp">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Adjust Salary Structure</h3>
                <p className="text-xs text-slate-450 mt-1">
                  Adjust compensation details for <span className="font-bold text-slate-700">{selectedEmp.name}</span>.
                </p>
              </div>
              <button 
                onClick={() => setShowStructureModal(false)}
                className="text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Adjust Form */}
            <form onSubmit={handleSaveStructure} className="space-y-4">
              
              {/* Base Salary Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Annual Base Salary ($)
                </label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  required
                />
              </div>

              {/* Bonus input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Annual Bonus / Allowances ($)
                </label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  required
                />
              </div>

              {/* Deductions input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Annual Deductions ($)
                </label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-505 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStructure}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-705 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  {savingStructure ? 'Saving changes...' : 'Save Structure'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
