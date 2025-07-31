import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const LoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, systemSettings } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      console.error('Error de login:', error.message);
      alert('Credenciales inválidas');
      return;
    }

    console.log('Login exitoso:', data.user);
    // Aquí puedes redirigir o actualizar el estado según tu lógica
  };

  const footerStyle = {
    fontFamily: systemSettings.footerFont || 'Inter, sans-serif',
    color: systemSettings.footerColor || '#64748b',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center mb-8">
            {systemSettings.logo ? (
              <img src={systemSettings.logo} alt="Logo" className="h-16 mx-auto mb-4" />
            ) : (
              <h1 className="text-5xl font-bold text-blue-600">Aweyt</h1>
            )}
            <p className="text-slate-500">Bienvenido de nuevo. Inicia sesión en tu cuenta.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="username"
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </form>
        </div>
      </motion.div>
      <footer className="text-center mt-8 text-slate-500 text-sm">
        <p>¿Eres un cliente? Accede a través del enlace proporcionado por la empresa.</p>
        <div className="flex items-center justify-center gap-2 mt-2" style={footerStyle}>
          {systemSettings.footerLogo && <img src={systemSettings.footerLogo} alt="Logo de la firma" className="h-5" />}
          <span>{systemSettings.footerText}</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginView;