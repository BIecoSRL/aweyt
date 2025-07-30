
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Building2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DepartmentManagement = ({ departments, addDepartment, deleteDepartment, callNextTicket, currentUser }) => {
  const departmentsToManage = currentUser.role === 'admin' 
    ? departments 
    : departments.filter(d => (currentUser.departmentIds || []).includes(d.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Departamentos</h2>
        {currentUser.role === 'admin' && (
          <Button
            onClick={() => {
              const name = prompt("Nombre del nuevo departamento:");
              if (name) addDepartment(name);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Departamento
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {departmentsToManage.map((dept, index) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activo
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4 text-slate-800 flex-grow">{dept.name}</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">En Espera:</span>
                  <span className="font-bold text-slate-700">{dept.waitingCount}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Button
                  onClick={() => callNextTicket(dept.id)}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={dept.waitingCount === 0}
                >
                  <Play className="h-3 w-3 mr-1.5" />
                  Llamar Siguiente
                </Button>
                {currentUser.role === 'admin' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-9 w-9 flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará el departamento y todos los servicios asociados. Los tickets históricos no se verán afectados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteDepartment(dept.id)}>
                          Sí, eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {departmentsToManage.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12"
          >
            <Building2 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-700">No hay departamentos asignados</h3>
            <p className="text-slate-500 mb-4">Contacta a un administrador para que te asigne a un departamento.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
