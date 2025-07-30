
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import bcrypt from 'bcryptjs';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const defaultSystemSettings = {
  name: 'Aweyt',
  logo: '',
  footerText: 'Una solución del Grupo Bieco',
  footerFont: 'Inter',
  footerColor: '#64748b',
  footerLogo: ''
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSystemSettings = useCallback(() => {
    try {
      const storedSettings = JSON.parse(localStorage.getItem('aweyt_system_settings'));
      setSystemSettings(storedSettings || defaultSystemSettings);
    } catch (error) {
      console.error("Failed to parse system settings from localStorage", error);
      setSystemSettings(defaultSystemSettings);
    }
  }, []);

  const loadSession = useCallback(() => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('aweyt_currentUser'));
      if (storedUser) {
        setUser(storedUser);
        if (storedUser.role === 'superadmin') {
          const settings = JSON.parse(localStorage.getItem('aweyt_system_settings'));
          setCompany({ name: settings?.name || 'Aweyt' });
        } else if (storedUser.companyId) {
          const companies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
          const userCompany = companies.find(c => c.id === storedUser.companyId);
          setCompany(userCompany || null);
        }
      } else {
        setUser(null);
        setCompany(null);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('aweyt_currentUser');
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystemSettings();
    loadSession();

    const handleStorageChange = (event) => {
      if (event.key === 'aweyt_system_settings') {
        loadSystemSettings();
      }
      if (event.key === 'aweyt_currentUser' || event.key === 'aweyt_companies') {
        loadSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadSystemSettings, loadSession]);

  const signIn = (username, password) => {
    const users = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    const foundUser = users.find(u => u.username === username);

    if (foundUser && bcrypt.compareSync(password, foundUser.passwordHash)) {
      if (!foundUser.activo) {
        toast({ variant: "destructive", title: "Acceso denegado", description: "Tu cuenta está inactiva. Contacta al administrador." });
        return false;
      }
      
      localStorage.setItem('aweyt_currentUser', JSON.stringify(foundUser));
      setUser(foundUser);

      if (foundUser.role === 'superadmin') {
        const settings = JSON.parse(localStorage.getItem('aweyt_system_settings'));
        setCompany({ name: settings?.name || 'Aweyt' });
      } else if (foundUser.companyId) {
        const companies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
        const userCompany = companies.find(c => c.id === foundUser.companyId);
        setCompany(userCompany || null);
      }
      
      toast({ title: "¡Bienvenido!", description: `Has iniciado sesión como ${username}.` });
      return true;
    }
    
    toast({ variant: "destructive", title: "Error de autenticación", description: "Usuario o contraseña incorrectos." });
    return false;
  };

  const signOut = () => {
    localStorage.removeItem('aweyt_currentUser');
    setUser(null);
    setCompany(null);
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
  };

  const value = {
    user,
    company,
    systemSettings,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
