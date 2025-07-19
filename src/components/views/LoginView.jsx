import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const LoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    signIn(username, password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50"
    >
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-blue-600 mb-2">
          Bienvenido a Aweyt
        </h1>
        <p className="text-xl text-slate-500">Sistema de Gestión de Turnos</p>
      </div>

      <div className="w-full max-w-sm">
        <form onSubmit={handleLogin} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-center text-slate-800">Acceso del Personal</h2>
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="username"
                type="text"
                placeholder="tu.usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Eres un cliente? Accede a través del enlace proporcionado por la empresa.
        </p>
      </div>
    </motion.div>
  );
};

export default LoginView;