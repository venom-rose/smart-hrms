import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <EmployeeDashboard />;
};

export default Dashboard;
