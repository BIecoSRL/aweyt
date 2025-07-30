import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueueProvider } from '@/contexts/QueueContext';
import '@/index.css';
import bcrypt from 'bcryptjs';
import { SUPER_ADMIN_MODULES } from '@/lib/constants';

const initializeSuperAdmin = () => {
  const isInitialized = localStorage.getItem('aweyt_initialized');
  if (!isInitialized) {
    console.log("First time setup: Initializing Super Admin...");

    const allUsers = [];
    const superAdminPermissions = SUPER_ADMIN_MODULES.map(m => m.id);

    const superAdminUser = {
      id: 1,
      username: 'superadmin',
      passwordHash: bcrypt.hashSync('password', 10),
      role: 'superadmin',
      permissions: superAdminPermissions,
      activo: true,
      companyId: 'super',
      photo: ''
    };

    allUsers.push(superAdminUser);

    localStorage.setItem('aweyt_users', JSON.stringify(allUsers));
    localStorage.setItem('aweyt_initialized', 'true');
    
    // Clean up other potential old data for a fresh start
    localStorage.removeItem('aweyt_currentUser');
    localStorage.removeItem('aweyt_companies');
    localStorage.removeItem('aweyt_system_settings');
    localStorage.removeItem('queueSystem_departments');
    localStorage.removeItem('queueSystem_services');
    localStorage.removeItem('queueSystem_tickets');
    localStorage.removeItem('aweyt_ticket_counters');
    localStorage.removeItem('aweyt_ticket_id_counter');

    console.log("Super Admin created and system initialized.");
  }
};

initializeSuperAdmin();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <QueueProvider>
          <App />
        </QueueProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);