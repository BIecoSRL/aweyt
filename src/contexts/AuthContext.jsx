import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Obtiene el usuario actual desde Supabase
  const getUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error al obtener usuario",
          description: error.message,
        });
        setUser(null);
        setLoading(false);
        return null;
      }
      setUser(data?.user || null);
      setLoading(false);
      return data?.user || null;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error inesperado al obtener usuario",
        description: err?.message || "Ocurrió un error inesperado.",
      });
      setUser(null);
      setLoading(false);
      return null;
    }
  }, [toast]);

  // Inicia sesión usando email y password
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: error.message,
        });
        setUser(null);
        setLoading(false);
        return false;
      }
      // Seguridad opcional: verifica si el correo está confirmado
      if (!data.user.email_confirmed_at) {
        toast({
          variant: "destructive",
          title: "Correo no verificado",
          description: "Por favor, verifica tu correo electrónico antes de iniciar sesión.",
        });
        setUser(null);
        setLoading(false);
        return false;
      }
      setUser(data.user);
      toast({
        variant: "default", // Cambia a "success" si tu sistema lo soporta
        title: "¡Bienvenido!",
        description: `Has iniciado sesión como ${email}.`,
      });
      setLoading(false);
      return true;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de red o inesperado",
        description: err?.message || "Ocurrió un error inesperado.",
      });
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  // Cierra sesión
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error al cerrar sesión",
          description: error.message,
        });
      } else {
        setUser(null);
        toast({
          variant: "default", // Cambia a "success" si tu sistema lo soporta
          title: "Sesión cerrada",
          description: "Has cerrado sesión exitosamente.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error inesperado al cerrar sesión",
        description: err?.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verifica si hay sesión activa al cargar
  useEffect(() => {
    let isMounted = true;
    getUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [getUser]);

  const value = {
    user,
    loading,
    login,
    logout,
    getUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
