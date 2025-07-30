
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, BarChart3, Timer, Monitor, Play, Pause, TrendingUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = ({ tickets, departments, isSystemActive, setIsSystemActive, currentUser, onLogout }) => {
  const { toast } = useToast();

  const userTickets = useMemo(() => {
    if (!tickets || !currentUser) return [];
    if (currentUser.role === 'admin') {
      return tickets;
    }
    return tickets.filter(t => t.servedBy === currentUser.id);
  }, [tickets, currentUser]);
  
  const waitingTicketsCount = useMemo(() => {
    if (!tickets || !currentUser) return 0;
    if (currentUser.role === 'admin') {
      return tickets.filter(t => t.status === 'waiting' && t.companyId === currentUser.companyId).length;
    }
    const userDeptIds = currentUser.departmentIds || [];
    return tickets.filter(t => t.status === 'waiting' && userDeptIds.includes(t.departmentId)).length;
  }, [tickets, currentUser]);

  const recentTickets = useMemo(() => {
    if (!tickets || !currentUser) return [];
    if (currentUser.role === 'admin') {
      return tickets.filter(t => t.companyId === currentUser.companyId).slice(-5).reverse();
    }
    const userDeptIds = currentUser.departmentIds || [];
    return tickets.filter(t => (userDeptIds.includes(t.departmentId) && ['waiting','called'].includes(t.status)) || t.servedBy === currentUser.id).slice(-5).reverse();
  }, [tickets, currentUser]);
  
  const completedTickets = userTickets.filter(t => t.status === 'completed' && t.completedAt && t.servedAt);
  const totalServiceTime = completedTickets.reduce((acc, t) => {
    const start = new Date(t.servedAt);
    const end = new Date(t.completedAt);
    return acc + (end - start);
  }, 0);
  const averageTime = completedTickets.length > 0 ? (totalServiceTime / completedTickets.length / 1000 / 60).toFixed(1) : 0;
  
  const statsCards = [
    {
      title: 'Tickets en Espera',
      value: waitingTicketsCount,
      icon: Users,
      color: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Atendidos por mí',
      value: completedTickets.length,
      icon: UserCheck,
      color: 'bg-green-100',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    {
      title: 'Departamentos Asignados',
      value: departments.length,
      icon: BarChart3,
      color: 'bg-purple-100',
      textColor: 'text-purple-800',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Mi Tiempo Promedio',
      value: averageTime,
      unit: ' min',
      icon: Timer,
      color: 'bg-orange-100',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600'
    }
  ];

  if (currentUser.role === 'admin') {
    statsCards[1].title = "Atendidos Hoy (Total)";
    statsCards[1].value = tickets.filter(t => t.status === 'completed' && t.companyId === currentUser.companyId).length;
    statsCards[2].title = "Departamentos Activos";
    const allCompleted = tickets.filter(t => t.status === 'completed' && t.completedAt && t.servedAt && t.companyId === currentUser.companyId);
    const totalTimeAll = allCompleted.reduce((acc, t) => acc + (new Date(t.completedAt) - new Date(t.servedAt)), 0);
    statsCards[3].title = "Tiempo Promedio (Global)";
    statsCards[3].value = allCompleted.length > 0 ? (totalTimeAll / allCompleted.length / 1000 / 60).toFixed(1) : 0;
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Bienvenido, {currentUser.username}</h2>
          <p className="text-slate-500">Este es el resumen de la actividad de hoy.</p>
        </div>
        <Button onClick={onLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.color} p-6 rounded-xl shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${card.textColor} font-medium`}>{card.title}</p>
                <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}<span className="text-lg">{card.unit}</span></p>
              </div>
              <card.icon className={`h-8 w-8 ${card.iconColor}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800">
            <Monitor className="h-5 w-5" />
            Estado del Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Sistema</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${isSystemActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isSystemActive ? 'Activo' : 'Inactivo'}
              </div>
            </div>
            {currentUser.role === 'admin' && (
              <Button
                onClick={() => {
                  setIsSystemActive(!isSystemActive);
                  toast({
                    title: isSystemActive ? "Sistema pausado" : "Sistema activado",
                    description: isSystemActive ? "La generación de tickets ha sido pausada." : "El sistema está ahora activo para recibir clientes.",
                  });
                }}
                variant="outline"
                className={`w-full ${isSystemActive ? 'hover:bg-red-50' : 'hover:bg-green-50'}`}
              >
                {isSystemActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isSystemActive ? 'Pausar Sistema' : 'Activar Sistema'}
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800">
            <TrendingUp className="h-5 w-5" />
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                <div>
                  <p className="font-medium text-slate-700">Ticket #{ticket.number}</p>
                  <p className="text-sm text-slate-500">{ticket.departmentName}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  ticket.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.status === 'serving' ? 'bg-blue-100 text-blue-800' :
                  ticket.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </div>
              </div>
            ))}
            {recentTickets.length === 0 && (
              <p className="text-slate-500 text-center py-4">No hay actividad reciente</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
