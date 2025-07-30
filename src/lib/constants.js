import { BarChart3, Users, Clock, TrendingUp, Settings as SettingsIcon, UserPlus, History, ShieldCheck, MonitorPlay, FileText, DollarSign } from 'lucide-react';

export const SUPER_ADMIN_MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3, roles: ['superadmin'] },
  { id: 'licenses', name: 'Licencias', icon: ShieldCheck, roles: ['superadmin'] },
  { id: 'license_history', name: 'Historial Licencias', icon: FileText, roles: ['superadmin'] },
  { id: 'screen_config', name: 'Config. Pantalla', icon: MonitorPlay, roles: ['superadmin'] },
  { id: 'finance', name: 'Finanzas', icon: DollarSign, roles: ['superadmin'] },
  { id: 'settings', name: 'Ajustes', icon: SettingsIcon, roles: ['superadmin'] },
];

export const ADMIN_MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3, roles: ['admin', 'employee'] },
  { id: 'departments', name: 'Departamentos', icon: Users, roles: ['admin'] },
  { id: 'tickets', name: 'Tickets', icon: Clock, roles: ['admin', 'employee'] },
  { id: 'history', name: 'Historial', icon: History, roles: ['admin', 'employee'] },
  { id: 'stats', name: 'Estadísticas', icon: TrendingUp, roles: ['admin'] },
  { id: 'services', name: 'Servicios', icon: SettingsIcon, roles: ['admin'] },
  { id: 'users', name: 'Usuarios', icon: UserPlus, roles: ['admin'] },
];

export const ALL_MODULES = [
  ...SUPER_ADMIN_MODULES,
  ...ADMIN_MODULES,
];