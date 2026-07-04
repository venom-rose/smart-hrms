import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Phone, 
  Briefcase, 
  Calendar, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  MapPin, 
  Mail, 
  Shield, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Lock, 
  CreditCard,
  Building2,
  FileCheck2,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'job' | 'salary' | 'documents'
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Form states - Personal Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // Form states - Job Info
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('General');
  const [designation, setDesignation] = useState('Associate');
  const [role, setRole] = useState('employee');
  const [dateOfJoining, setDateOfJoining] = useState('');

  // Form states - Salary Info
  const [salary, setSalary] = useState(30000);
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);

  // Form states - Documents
  const [documents, setDocuments] = useState([]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const targetId = id || currentUser?._id;
      if (!targetId) return;

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/employees/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const emp = data.data;
        setProfileUser(emp);
        
        // Populate states
        setName(emp.name || '');
        setEmail(emp.email || '');
        setContact(emp.contact || '');
        setAddress(emp.address || '');
        setSkills(emp.skills || []);
        setProfilePicture(emp.profilePicture || '');
        setEmployeeId(emp.employeeId || '');
        setDepartment(emp.department || 'General');
        setDesignation(emp.designation || 'Associate');
        setRole(emp.role || 'employee');
        
        if (emp.dateOfJoining) {
          setDateOfJoining(new Date(emp.dateOfJoining).toISOString().substring(0, 10));
        } else {
          setDateOfJoining('');
        }

        setSalary(emp.salary || 0);
        setAllowances(emp.allowances || 0);
        setDeductions(emp.deductions || 0);
        setDocuments(emp.documents || []);
      } else {
        showNotification(data.message || 'Error loading profile details', 'error');
        if (id) navigate('/profile');
      }
    } catch (err) {
      console.error(err);
      showNotification('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Check if non-admin tries to view another user's ID
      if (id && currentUser.role !== 'admin' && currentUser._id !== id) {
        navigate('/profile');
        return;
      }
      fetchProfile();
    }
  }, [id, currentUser?._id]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Image Upload handler (Base64 conversion)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result);
      autoSaveProfilePicture(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const autoSaveProfilePicture = async (base64Img) => {
    const targetId = id || currentUser?._id;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/employees/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture: base64Img })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Profile picture updated successfully', 'success');
        if (currentUser && currentUser._id === targetId) {
          // Update the context immediately so changes reflect everywhere (e.g. sidebar avatar)
          currentUser.profilePicture = base64Img;
        }
      } else {
        showNotification(data.message || 'Failed to upload profile picture', 'error');
      }
    } catch (err) {
      showNotification('Server connection failed', 'error');
    }
  };

  // Document Upload handler
  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Document size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const newDoc = {
        name: file.name,
        url: reader.result, // base64 representation of file
        uploadedAt: new Date()
      };

      const updatedDocs = [...documents, newDoc];
      setDocuments(updatedDocs);

      const targetId = id || currentUser?._id;
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/employees/${targetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ documents: updatedDocs })
        });
        const data = await res.json();
        if (data.success) {
          showNotification(`Document "${file.name}" uploaded successfully`, 'success');
          setDocuments(data.data.documents || updatedDocs);
        } else {
          showNotification(data.message || 'Failed to save uploaded document', 'error');
        }
      } catch (err) {
        showNotification('Server connection failed', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentDelete = async (docIndex) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    const updatedDocs = documents.filter((_, idx) => idx !== docIndex);
    setDocuments(updatedDocs);

    const targetId = id || currentUser?._id;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/employees/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ documents: updatedDocs })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Document deleted successfully', 'success');
        setDocuments(data.data.documents || updatedDocs);
      } else {
        showNotification(data.message || 'Failed to delete document', 'error');
      }
    } catch (err) {
      showNotification('Server connection failed', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const targetId = id || currentUser?._id;

    let updatedFields = {};
    if (currentUser.role === 'admin') {
      updatedFields = {
        name,
        email,
        employeeId,
        role,
        department,
        designation,
        salary: Number(salary),
        allowances: Number(allowances),
        deductions: Number(deductions),
        contact,
        address,
        skills
      };
    } else {
      // Normal employee can only edit phone, address, skills
      updatedFields = {
        contact,
        address,
        skills
      };
    }

    const res = await updateProfile(targetId, updatedFields);
    setUpdating(false);

    if (res.success) {
      showNotification('Profile updated successfully', 'success');
      setProfileUser(res.data);
    } else {
      showNotification(res.message || 'Failed to update profile', 'error');
    }
  };

  const isEditable = (field) => {
    if (currentUser?.role === 'admin') return true;
    // Regular employee can only edit contact, address, skills
    return ['contact', 'address', 'skills'].includes(field);
  };

  const isSelf = !id || id === currentUser?._id;

  if (loading || !profileUser) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading Profile Details...</p>
      </div>
    );
  }

  // Calculate Net Compensation
  const grossSalary = salary + allowances;
  const netSalary = grossSalary - deductions;
  const monthlyTakeHome = netSalary / 12;

  // Initial letters helper
  const getInitials = (userName) => {
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'General'];
  const roles = ['employee', 'admin'];

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

      {/* Roster Return Link for Admin */}
      {!isSelf && currentUser.role === 'admin' && (
        <div className="mb-2">
          <Link to="/employees" className="text-xs font-semibold text-indigo-650 hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
            &larr; Back to Employee Directory
          </Link>
        </div>
      )}

      {/* Header Profile Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl overflow-hidden relative border border-indigo-900/30 animate-slideUp">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none"></div>
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          
          {/* Avatar Picture */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-indigo-500/50 shadow-2xl transition-all duration-300 bg-slate-800 flex items-center justify-center font-bold text-3xl md:text-4xl text-indigo-200">
              {profilePicture ? (
                <img src={profilePicture} alt={name} className="w-full h-full object-cover" />
              ) : (
                getInitials(name)
              )}
            </div>
            {/* Hover overlay to upload image */}
            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Upload className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider">Change Photo</span>
              <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
            </label>
          </div>

          {/* Hero Meta details */}
          <div className="text-center md:text-left space-y-3.5 flex-1 mt-2">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{name}</h1>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  role === 'admin' 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  {role}
                </span>
              </div>
              <p className="text-indigo-200/85 text-sm font-medium mt-1">
                {designation} &bull; {department} Department
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 text-xs text-slate-300 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>ID: {employeeId}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{email}</span>
              </div>
              {dateOfJoining && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Joined: {new Date(dateOfJoining).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Tab Controls (Left Sidebar on desktop) */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex md:flex-col gap-1 overflow-x-auto md:overflow-visible shrink-0 col-span-1">
          {[
            { id: 'personal', label: 'Personal Information', icon: User },
            { id: 'job', label: 'Job Details', icon: Briefcase },
            { id: 'salary', label: 'Salary Structure', icon: Wallet },
            { id: 'documents', label: 'Corporate Documents', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 shrink-0 text-left ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents (Right on desktop) */}
        <div className="md:col-span-3">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Header of Content Box */}
            <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-slate-800 text-base capitalize">{activeTab} Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeTab === 'personal' && 'Manage core contact settings, home address details and professional tags.'}
                  {activeTab === 'job' && 'Corporate parameters including system role authorizations and job placements.'}
                  {activeTab === 'salary' && 'Review details of compensation package including deductions and net pay.'}
                  {activeTab === 'documents' && 'Access company contract files, safety sheets and upload credentials.'}
                </p>
              </div>
              
              {/* Permission Tooltip Badge */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                currentUser.role === 'admin' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-amber-50 text-amber-705 border border-amber-100'
              }`}>
                {currentUser.role === 'admin' ? (
                  <>
                    <UserCheck className="w-3 h-3" /> Full Editor Access
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" /> Restricted Access
                  </>
                )}
              </span>
            </div>

            {/* Content Switcher */}
            <div className="p-6">
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditable('name')}
                          className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 ${
                            isEditable('name')
                              ? 'bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!isEditable('email')}
                          className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 ${
                            isEditable('email')
                              ? 'bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="e.g. 9876543210"
                          disabled={!isEditable('contact')}
                          className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 ${
                            isEditable('contact')
                              ? 'bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Home Address */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Home Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. Apartment, Street, City"
                          disabled={!isEditable('address')}
                          className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 ${
                            isEditable('address')
                              ? 'bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills tags matrix */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Talent & Skill Matrix</label>
                    <p className="text-xs text-slate-400">Add technical skills or certifications that contribute to team matching.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-105"
                        >
                          {skill}
                          {isEditable('skills') && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-indigo-400 hover:text-rose-600 focus:outline-none"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                      ))}
                      {skills.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No skills listed yet. Add skills below.</span>
                      )}
                    </div>

                    {isEditable('skills') && (
                      <div className="flex gap-2 max-w-sm pt-2">
                        <input
                          type="text"
                          placeholder="e.g. Python, Agile, Photoshop"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSkill(e);
                            }
                          }}
                          className="block flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'job' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee ID */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Employee ID</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        disabled={!isEditable('employeeId')}
                        className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 ${
                          isEditable('employeeId')
                            ? 'bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Designation</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        disabled={!isEditable('designation')}
                        className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 ${
                          isEditable('designation')
                            ? 'bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-850'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={!isEditable('department')}
                        className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 focus:outline-none ${
                          isEditable('department')
                            ? 'bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Access Role */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">System Access Role</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Shield className="w-4 h-4" />
                      </span>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={!isEditable('role')}
                        className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 focus:outline-none ${
                          isEditable('role')
                            ? 'bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r} className="capitalize">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Joining</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        value={dateOfJoining}
                        onChange={(e) => setDateOfJoining(e.target.value)}
                        disabled={!isEditable('dateOfJoining')}
                        className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm transition-all duration-200 focus:outline-none ${
                          isEditable('dateOfJoining')
                            ? 'bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800'
                            : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'salary' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Premium Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Gross Earnings Card */}
                    <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute right-3 top-3 opacity-20 text-emerald-800">
                        <TrendingUp className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Gross Earnings</span>
                        <h4 className="text-2xl font-extrabold text-emerald-900 mt-2">
                          ${grossSalary.toLocaleString()}
                        </h4>
                      </div>
                      <span className="text-xs text-emerald-700/80 mt-4 block">Annual Base + Allowances</span>
                    </div>

                    {/* Total Deductions Card */}
                    <div className="bg-rose-50/60 rounded-2xl border border-rose-100 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute right-3 top-3 opacity-20 text-rose-800">
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Total Deductions</span>
                        <h4 className="text-2xl font-extrabold text-rose-900 mt-2">
                          ${deductions.toLocaleString()}
                        </h4>
                      </div>
                      <span className="text-xs text-rose-705/85 mt-4 block">Annual Taxes, PF & Insurance</span>
                    </div>

                    {/* Net Take-Home Card */}
                    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute right-3 top-3 opacity-20 text-indigo-805">
                        <Wallet className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Net Take-Home (Est.)</span>
                        <h4 className="text-2xl font-extrabold text-indigo-900 mt-2">
                          ${netSalary.toLocaleString()}
                        </h4>
                      </div>
                      <span className="text-xs text-indigo-700 mt-4 block">
                        Approx: ${Math.round(monthlyTakeHome).toLocaleString()} / Month
                      </span>
                    </div>
                  </div>

                  {/* Editors Fields for Admin / Renders inputs */}
                  {currentUser.role === 'admin' ? (
                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">Adjust Compensation Scales</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Basic Salary */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Annual Basic Salary ($)</label>
                          <input
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(Number(e.target.value))}
                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-sm"
                            required
                          />
                        </div>

                        {/* Allowances */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Annual Allowances ($)</label>
                          <input
                            type="number"
                            value={allowances}
                            onChange={(e) => setAllowances(Number(e.target.value))}
                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-sm"
                            required
                          />
                        </div>

                        {/* Deductions */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Annual Deductions ($)</label>
                          <input
                            type="number"
                            value={deductions}
                            onChange={(e) => setDeductions(Number(e.target.value))}
                            className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Read only view of details
                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="font-bold text-slate-800 text-sm mb-4">Salary Structure Breakdown</h4>
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/65 divide-y divide-slate-200/50 text-xs">
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-slate-500 font-medium">Basic Salary</span>
                          <span className="font-semibold text-slate-800">${salary.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-slate-500 font-medium">Allowance (HRA, Transit, Medical)</span>
                          <span className="font-semibold text-slate-800">${allowances.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-slate-500 font-bold">Gross Earnings</span>
                          <span className="font-bold text-slate-800">${grossSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 text-rose-700">
                          <span className="font-medium text-slate-550">Taxes, Insurance & PF Deductions</span>
                          <span className="font-semibold">-${deductions.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 text-indigo-700 font-extrabold text-sm">
                          <span>Net In-Hand Annual Income</span>
                          <span>${netSalary.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {/* Header info / Document Uploader Box */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Credential Directory</h4>
                      <p className="text-xs text-slate-400 mt-0.5">PDF or image files associated with employment credentials.</p>
                    </div>
                    
                    {/* Document Upload Button Trigger */}
                    <label className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/10 self-start sm:self-auto">
                      <Plus className="w-4 h-4" /> Upload Document
                      <input type="file" onChange={handleDocumentUpload} className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" />
                    </label>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-3.5">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/5 transition-all duration-200 animate-slideUp">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-150">
                            <FileText className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block truncate max-w-[250px] sm:max-w-md">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Uploaded on: {new Date(doc.uploadedAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Document Action triggers */}
                        <div className="flex items-center gap-1">
                          {doc.url && doc.url !== '#' ? (
                            <a
                              href={doc.url}
                              download={doc.name}
                              className="p-2 bg-slate-50 text-slate-500 hover:text-indigo-650 hover:bg-indigo-55 rounded-lg border border-slate-150 transition-all"
                              title="Download document file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert('This is a seeded sample document. To download a real document, upload a new file.')}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-150 transition-all"
                              title="Mock file (not downloadable)"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDocumentDelete(idx)}
                            className="p-2 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-150 transition-all"
                            title="Delete file permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {documents.length === 0 && (
                      <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs text-slate-400 italic">No credentials uploaded yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Save bar for forms */}
            {activeTab !== 'documents' && (
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 italic">
                  {currentUser.role !== 'admin' && activeTab !== 'personal' 
                    ? 'Only Administrators can update this page.' 
                    : 'Unsaved edits will be lost unless you save.'}
                </span>
                
                {/* Save button, disabled if not editable */}
                {(currentUser.role === 'admin' || activeTab === 'personal') && (
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-md shadow-indigo-650/15 disabled:opacity-50 disabled:cursor-not-allowed animate-fadeIn"
                  >
                    {updating ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
