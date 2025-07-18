import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Statistics = ({ tickets, departments, services }) => {
  const { toast } = useToast();

  const calculateFulfillment = (ticket) => {
    if (ticket.status !== 'completed' || !ticket.servedAt || !ticket.completedAt) {
      return null;
    }
    const service = services.find(s => s.id === ticket.serviceId);
    if (!service) return null;

    const estimatedTime = service.avgTime * 60 * 1000; // in ms
    const actualTime = new Date(ticket.completedAt) - new Date(ticket.servedAt);

    if (actualTime <= 0) return 100;
    
    const fulfillment = (estimatedTime / actualTime) * 100;
    return Math.min(Math.round(fulfillment), 200); // Cap at 200%
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Estadísticas y Reportes</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
            <BarChart3 className="h-5 w-5" />
            Resumen del Día
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total de Tickets Generados</span>
              <span className="text-2xl font-bold text-blue-600">{tickets.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tickets Completados</span>
              <span className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'completed').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tickets en Espera</span>
              <span className="text-2xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'waiting').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tickets Siendo Atendidos</span>
              <span className="text-2xl font-bold text-purple-600">{tickets.filter(t => t.status === 'serving').length}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
            <TrendingUp className="h-5 w-5" />
            Rendimiento por Departamento
          </h3>
          <div className="space-y-3">
            {departments.map((dept) => {
              const completedTickets = tickets.filter(t => t.departmentId === dept.id && t.status === 'completed');
              return (
                <div key={dept.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${dept.color}`}></div>
                    <span className="font-medium text-slate-600">{dept.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{completedTickets.length}</div>
                    <div className="text-xs text-slate-500">completados</div>
                  </div>
                </div>
              );
            })}
            {departments.length === 0 && (
              <p className="text-slate-500 text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
            <Calendar className="h-5 w-5" />
            Historial de Tickets
          </h3>
          <Button
            onClick={() => {
              toast({
                title: "🚧 Esta función no está implementada aún—¡pero no te preocupes! ¡Puedes solicitarla en tu próximo mensaje! 🚀",
              });
            }}
            variant="outline"
            size="sm"
          >
            Exportar Reporte
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-2 font-medium text-slate-500">Ticket</th>
                <th className="text-left p-2 font-medium text-slate-500">Servicio</th>
                <th className="text-left p-2 font-medium text-slate-500">Estado</th>
                <th className="text-left p-2 font-medium text-slate-500">T. Real</th>
                <th className="text-left p-2 font-medium text-slate-500">T. Estimado</th>
                <th className="text-left p-2 font-medium text-slate-500">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(-10).reverse().map((ticket) => {
                const fulfillment = calculateFulfillment(ticket);
                const service = services.find(s => s.id === ticket.serviceId);
                const actualTime = ticket.servedAt && ticket.completedAt ? ((new Date(ticket.completedAt) - new Date(ticket.servedAt)) / 60000).toFixed(1) : '-';
                const fulfillmentColor = fulfillment === null ? 'text-slate-500' : fulfillment >= 100 ? 'text-green-600' : fulfillment >= 80 ? 'text-yellow-600' : 'text-red-600';

                return (
                  <tr key={ticket.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-700">#{ticket.number}</td>
                    <td className="p-2 text-slate-600">{ticket.serviceName}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ticket.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'serving' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.status === 'waiting' ? 'Esperando' :
                         ticket.status === 'serving' ? 'Atendiendo' : 'Completado'}
                      </span>
                    </td>
                    <td className="p-2 text-slate-600">{actualTime} min</td>
                    <td className="p-2 text-slate-600">{service ? `${service.avgTime} min` : '-'}</td>
                    <td className={`p-2 font-bold ${fulfillmentColor}`}>
                      {fulfillment !== null ? `${fulfillment}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tickets.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No hay tickets registrados
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics;