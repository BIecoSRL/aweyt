import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/dashboard/Dashboard';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import DepartmentManagement from '@/components/departments/DepartmentManagement';
import TicketManagement from '@/components/tickets/TicketManagement';
import Statistics from '@/components/stats/Statistics';
import ServiceManagement from '@/components/services/ServiceManagement';
import UserManagement from '@/components/users/UserManagement';
import HistoryView from '@/components/history/HistoryView';
import LicenseManagement from '@/components/licenses/LicenseManagement';
import ScreenConfig from '@/components/config/ScreenConfig';
import LicenseHistory from '@/components/licenses/LicenseHistory';
import Finance from '@/components/finance/Finance';
import SuperAdminSettings from '@/components/settings/SuperAdminSettings';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_MODULES } from '@/lib/constants';

const EmployeeView = ({ onLogout, currentUser, ...props }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { company } = useAuth();

  const navigation = useMemo(() => {
    if (!currentUser || !currentUser.permissions) return [];
    
    return ALL_MODULES.filter(m => currentUser.permissions.includes(m.id) && m.roles.includes(currentUser.role));
    
  }, [currentUser]);

  useEffect(() => {
    if (navigation.length > 0 && !navigation.some(nav => nav.id === currentView)) {
      setCurrentView(navigation[0].id);
    }
  }, [navigation, currentView]);

  const renderContent = () => {
    const hasAccess = navigation.some(nav => nav.id === currentView);
    if (!hasAccess && navigation.length > 0) {
      setCurrentView(navigation[0].id);
      return null;
    }
    if (!hasAccess && navigation.length === 0) {
        return <div className="text-center p-8"><h2 className="text-2xl font-bold">Sin acceso</h2><p>No tienes permisos para ver ningún módulo.</p></div>;
    }

    switch (currentView) {
      case 'dashboard':
        return currentUser.role === 'superadmin' ? <SuperAdminDashboard /> : <Dashboard {...props} currentUser={currentUser} onLogout={onLogout} />;
      case 'departments':
        return <DepartmentManagement {...props} currentUser={currentUser} />;
      case 'tickets':
        return <TicketManagement {...props} currentUser={currentUser} />;
      case 'services':
        return <ServiceManagement {...props} />;
      case 'users':
        return <UserManagement {...props} currentUser={currentUser} />;
      case 'stats':
        return <Statistics {...props} />;
      case 'history':
        return <HistoryView {...props} currentUser={currentUser} />;
      case 'licenses':
        return <LicenseManagement />;
      case 'screen_config':
        return <ScreenConfig />;
      case 'license_history':
        return <LicenseHistory />;
      case 'finance':
        return <Finance />;
      case 'settings':
        return currentUser.role === 'superadmin' ? <SuperAdminSettings /> : <UserManagement {...props} currentUser={currentUser} />;
      default:
        return currentUser.role === 'superadmin' ? <SuperAdminDashboard /> : <Dashboard {...props} currentUser={currentUser} onLogout={onLogout} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col"
      >
        <div className="mb-8 p-2">
          <h1 className="text-2xl font-bold text-blue-600">
            {company?.name || 'Aweyt'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Panel de {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
        </div>

        <nav className="space-y-1 flex-grow">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
        
        <Button onClick={onLogout} variant="ghost" className="text-slate-600 hover:bg-slate-100">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </motion.div>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
};

export default EmployeeView;