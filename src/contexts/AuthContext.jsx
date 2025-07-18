import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SUPER_ADMIN_MODULES } from '@/lib/constants';
import bcrypt from 'bcryptjs';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const { toast } = useToast();

  const resetAndEnsureSuperAdmin = useCallback(() => {
    try {
      let users = JSON.parse(localStorage.getItem('turnosmart_users')) || [];
      
      const nonSuperAdminUsers = users.filter(u => u.role !== 'superadmin');
      
      const salt = bcrypt.genSaltSync(10);
      const adminUser = {
        id: 0,
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', salt),
        role: 'superadmin',
        activo: true,
        permissions: SUPER_ADMIN_MODULES.map(m => m.id),
        companyId: 'super',
      };
      
      const finalUsers = [...nonSuperAdminUsers, adminUser];
      localStorage.setItem('turnosmart_users', JSON.stringify(finalUsers));
      console.log("Super Administrador ha sido reestablecido.");

    } catch (e) {
      console.error("Error crítico al reestablecer el super administrador:", e);
      // No toast here to avoid bothering user on every load
    }
  }, []);
  
  const loadCompanyData = (user) => {
    if (user?.companyId && user.companyId !== 'super') {
      const companies = JSON.parse(localStorage.getItem('turnosmart_companies')) || [];
      const userCompany = companies.find(c => c.id === user.companyId);
      setCompany(userCompany || null);
    } else {
      const systemSettings = JSON.parse(localStorage.getItem('turnosmart_system_settings')) || {};
      setCompany({ name: systemSettings.name || 'TurnoSmart' });
    }
  };

  useEffect(() => {
    // Se asegura de que el superadmin se reestablezca en cada carga de la app
    resetAndEnsureSuperAdmin();
    
    const sessionUser = localStorage.getItem('turnosmart_user');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      // Validar si el usuario en sesión sigue existiendo, especialmente si era un superadmin
      const users = JSON.parse(localStorage.getItem('turnosmart_users')) || [];
      const userExists = users.some(u => u.id === parsedUser.id && u.username === parsedUser.username);

      if (userExists) {
        setUser(parsedUser);
        loadCompanyData(parsedUser);
      } else {
        // Si el usuario en sesión ya no existe (p. ej. un superadmin eliminado), se limpia la sesión
        localStorage.removeItem('turnosmart_user');
        setUser(null);
      }
    }
    setLoading(false);
  }, [resetAndEnsureSuperAdmin]);

  const signIn = useCallback((username, password) => {
    const users = JSON.parse(localStorage.getItem('turnosmart_users')) || [];
    const foundUser = users.find(u => u.username === username);

    if (!foundUser || !bcrypt.compareSync(password, foundUser.passwordHash)) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "Usuario o contraseña incorrectos." });
      return;
    }

    if (!foundUser.activo) {
      toast({ variant: "destructive", title: "Cuenta inactiva", description: "Tu cuenta está desactivada. Contacta al administrador." });
      return;
    }

    const { passwordHash, ...userData } = foundUser;
    setUser(userData);
    localStorage.setItem('turnosmart_user', JSON.stringify(userData));
    loadCompanyData(userData);
    toast({ title: "¡Bienvenido!", description: `Has iniciado sesión como ${userData.username}.` });
  }, [toast]);

  const signOut = useCallback(() => {
    setUser(null);
    setCompany(null);
    localStorage.removeItem('turnosmart_user');
  }, []);

  const value = { user, loading, signIn, signOut, company };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};