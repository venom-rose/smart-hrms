import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Edit, 
  Trash2, 
  X, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Search,
  Filter,
  Download
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Selected employee for editing
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editRole, setEditRole] = useState('employee');
  const [editDepartment, setEditDepartment] = useState('Engineering');
  const [editDesignation, setEditDesignation] = useState('');
  const [editSalary, setEditSalary] = useState('30000');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtering & Searching state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to load employee list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp);
    setEditName(emp.name);
    setEditContact(emp.contact || '');
    setEditRole(emp.role);
    setEditDepartment(emp.department);
    setEditDesignation(emp.designation);
    setEditSalary(emp.salary?.toString() || '30000');
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editName || !editDesignation) {
      showNotification('Please enter all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/employees/${selectedEmp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          contact: editContact,
          role: editRole,
          department: editDepartment,
          designation: editDesignation,
          salary: Number(editSalary)
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Profile updated successfully', 'success');
        setShowEditModal(false);
        await fetchEmployees();
      } else {
        showNotification(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showNotification('Server connection error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee profile? This action is irreversible.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Employee profile deleted', 'success');
        await fetchEmployees();
      } else {
        showNotification(data.message || 'Deletion failed', 'error');
      }
    } catch (err) {
      showNotification('Server connection error', 'error');
    }
  };

  // Filter computation
  const getFilteredEmployees = () => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = !deptFilter || emp.department === deptFilter;
      const matchesRole = !roleFilter || emp.role === roleFilter;
      return matchesSearch && matchesDept && matchesRole;
    });
  };

  // Export report to CSV
  const handleExportCSV = () => {
    const targetData = getFilteredEmployees();
    if (targetData.length === 0) {
      showNotification('No employee records to export', 'error');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Base Salary', 'Contact', 'Role', 'Joining Date'];
    const rows = targetData.map(emp => [
      emp.employeeId || '',
      emp.name || '',
      emp.email || '',
      emp.department || '',
      emp.designation || '',
      emp.salary || 0,
      emp.contact || '',
      emp.role || '',
      emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees_directory_report.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Employees CSV report downloaded successfully', 'success');
  };

  const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'General'];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-10 h-10 text-indigo-655 animate-spin" />
        <span className="text-xs text-slate-450 font-semibold">Loading Employees Directory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Toast Alert */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Employee Directory</h2>
          <p className="text-slate-500 text-sm mt-1">Review list of registered personnel, update parameters, and adjust salary ranks.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Search and Filters panel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">Corporate Roster</h3>
            <span className="text-xs font-semibold bg-slate-100 text-slate-655 px-2.5 py-1 rounded-full">
              {getFilteredEmployees().length} Members
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
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

            {/* Department Filter */}
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

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 bg-white"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin / HR</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
        </div>

        {getFilteredEmployees().length === 0 ? (
          <div className="h-64 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
            <Users className="w-8 h-8 mb-2 stroke-1" />
            <p className="text-sm font-semibold">No roster records match selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Name</th>
                  <th className="pb-3.5">Department</th>
                  <th className="pb-3.5">Designation</th>
                  <th className="pb-3.5">Salary ($)</th>
                  <th className="pb-3.5">Contact</th>
                  <th className="pb-3.5">Joining Date</th>
                  <th className="pb-3.5 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55">
                {getFilteredEmployees().map((emp) => (
                  <tr key={emp._id} className="text-slate-700 hover:bg-slate-50/40 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 pl-2">
                      <div>
                        <Link to={`/profile/${emp._id}`} className="font-semibold text-indigo-650 hover:text-indigo-800 hover:underline block" title="View full profile">
                          {emp.name}
                        </Link>
                        <span className="text-[10px] text-slate-400 capitalize">Role: {emp.role}</span>
                      </div>
                    </td>
                    
                    {/* Department */}
                    <td className="py-3.5 font-semibold text-slate-800 text-xs">{emp.department}</td>

                    {/* Designation */}
                    <td className="py-3.5 font-medium text-xs">{emp.designation}</td>

                    {/* Salary */}
                    <td className="py-3.5 font-bold text-slate-850">
                      {emp.salary ? emp.salary.toLocaleString() : '0'}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 text-xs text-slate-500">{emp.contact || '--'}</td>

                    {/* Joining Date */}
                    <td className="py-3.5 text-xs text-slate-550">
                      {new Date(emp.dateOfJoining).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-indigo-600 rounded border border-slate-150 transition-colors"
                          title="Edit employee parameters"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-red-650 rounded border border-slate-150 transition-colors"
                          title="Delete employee profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal (Glass Overlay) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl p-6 space-y-6 animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">Modify Employee Parameters</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                    required
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Department
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Salary ($)
                  </label>
                  <input
                    type="number"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* System Role */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    System Role Access
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin / HR</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-705 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  {saving ? 'Saving changes...' : 'Save Parameters'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
