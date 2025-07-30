import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const QueueContext = createContext();

export const QueueProvider = ({ children }) => {
  const [departments, setDepartments] = useState(() => JSON.parse(localStorage.getItem('queueSystem_departments')) || []);
  const [services, setServices] = useState(() => JSON.parse(localStorage.getItem('queueSystem_services')) || []);
  const [tickets, setTickets] = useState(() => JSON.parse(localStorage.getItem('queueSystem_tickets')) || []);
  const [allCompanies, setAllCompanies] = useState(() => JSON.parse(localStorage.getItem('aweyt_companies')) || []);
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('aweyt_users')) || []);
  
  useEffect(() => {
    const handleStorageChange = () => {
      setDepartments(JSON.parse(localStorage.getItem('queueSystem_departments')) || []);
      setServices(JSON.parse(localStorage.getItem('queueSystem_services')) || []);
      setTickets(JSON.parse(localStorage.getItem('queueSystem_tickets')) || []);
      setAllCompanies(JSON.parse(localStorage.getItem('aweyt_companies')) || []);
      setUsers(JSON.parse(localStorage.getItem('aweyt_users')) || []);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value = useMemo(() => ({
    departments,
    services,
    tickets,
    allCompanies,
    users,
  }), [departments, services, tickets, allCompanies, users]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
};

export const useQueueData = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueueData must be used within a QueueProvider');
  }
  return context;
};