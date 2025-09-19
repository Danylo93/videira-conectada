// Enhanced Reports System - Main Router
// Routes users to appropriate report interface based on role

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ReportsAdmin from './ReportsAdmin';
import SimpleReportsAdmin from './SimpleReportsAdmin';
import ReportsDiscipulador from './ReportsDiscipulador';
import ReportsLeader from './ReportsLeader';

const Reports: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Carregando...</h2>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Route based on user role
  if (user.role === 'pastor' || user.role === 'obreiro') {
    return <SimpleReportsAdmin />;
  }

  if (user.role === 'discipulador') {
    return <ReportsDiscipulador />;
  }

  if (user.role === 'lider') {
    return <ReportsLeader />;
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Acesso Negado</h2>
        <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
      </div>
    </div>
  );
};

export default Reports;
