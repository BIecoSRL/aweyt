import React from 'react';
import { useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Helmet } from 'react-helmet';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import useQueueSystem from '@/hooks/useQueueSystem';
import { useAuth } from '@/contexts/AuthContext';
import LoginView from '@/components/views/LoginView';
import CustomerView from '@/components/views/CustomerView';
import EmployeeView from '@/components/views/EmployeeView';
import PublicDisplayView from '@/components/views/PublicDisplayView';


function App() {
  const { user, signOut, loading, company } = useAuth();
  const queueSystem = useQueueSystem(user);
  useEffect(() => {
  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*');
    console.log('Tickets:', data);
    if (error) console.error('Error al leer tickets:', error);
  };
  fetchTickets();
}, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-blue-600">Cargando...</div>;
  }

  return (
    <>
      <Helmet>
        <title>{company?.name || 'Aweyt'} - Sistema de Gestión de Turnos</title>
        <meta name="description" content={`Software profesional de gestión de turnos para ${company?.name || 'Aweyt'}. Automatiza el control de filas y mejora la eficiencia.`} />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/panel" replace /> : <LoginView />
            } 
          />
          <Route 
            path="/panel" 
            element={
              user ? (
                <EmployeeView {...queueSystem} currentUser={user} onLogout={signOut} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/customer/:companySlug" 
            element={ <CustomerView /> } 
          />
           <Route 
            path="/public/:companySlug" 
            element={<PublicDisplayView />} 
          />
          <Route path="/*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </div>
    </>
  );
}

export default App;