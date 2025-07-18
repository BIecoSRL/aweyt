import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QueueManagement = ({ queues, createQueue, callNextTicket }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Colas</h2>
        <Button
          onClick={() => {
            const name = prompt("Nombre de la nueva cola:");
            if (name) {
              const type = prompt("Tipo de cola (ej: Atención General, Caja):") || "General";
              createQueue(name, type);
            }
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cola
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {queues.map((queue, index) => (
            <motion.div
              key={queue.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-4 h-4 rounded-full ${queue.color}`}></div>
                <div className={`px-2 py-1 rounded text-xs ${queue.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {queue.isActive ? 'Activa' : 'Inactiva'}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{queue.name}</h3>
              <p className="text-gray-300 text-sm mb-4">{queue.type}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">En Espera:</span>
                  <span className="font-bold">{queue.waitingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tiempo Promedio:</span>
                  <span className="font-bold">{queue.averageTime} min</span>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  onClick={() => callNextTicket(queue.id)}
                  size="sm"
                  className="w-full bg-green-500 hover:bg-green-600"
                  disabled={!queue.isActive || queue.waitingCount === 0}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Llamar Siguiente
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {queues.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12"
          >
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay colas creadas</h3>
            <p className="text-gray-400 mb-4">Crea tu primera cola para comenzar a gestionar turnos</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QueueManagement;