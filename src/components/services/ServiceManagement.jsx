import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
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

const ServiceForm = ({ onSave, initialData = {}, departments, isEdit = false }) => {
  const [serviceName, setServiceName] = useState(initialData.name || '');
  const [selectedDept, setSelectedDept] = useState(initialData.departmentId ? initialData.departmentId.toString() : '');
  const [avgTime, setAvgTime] = useState(initialData.avgTime || 5);

  const handleSubmit = () => {
    if (serviceName && selectedDept && avgTime > 0) {
      onSave({ name: serviceName, departmentId: parseInt(selectedDept, 10), avgTime: parseInt(avgTime, 10) }, isEdit ? initialData.id : null);
    }
  };

  return (
    <div className="py-4 space-y-4">
      <div>
        <Label htmlFor="service-name">Nombre del servicio</Label>
        <Input
          id="service-name"
          placeholder="Ej: Consulta General"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
      </div>
      <div>
        <Label>Departamento</Label>
        <Select onValueChange={setSelectedDept} value={selectedDept}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar departamento..." />
          </SelectTrigger>
          <SelectContent>
            {departments.map(d => (
              <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="avg-time">Tiempo de atención estimado (minutos)</Label>
        <Input
          id="avg-time"
          type="number"
          value={avgTime}
          onChange={(e) => setAvgTime(e.target.value)}
          min="1"
        />
      </div>
      <Button onClick={handleSubmit} className="w-full" disabled={!serviceName || !selectedDept || avgTime <= 0}>
        {isEdit ? 'Guardar Cambios' : 'Añadir Servicio'}
      </Button>
    </div>
  );
};

const ServiceManagement = ({ services, departments, addService, updateService, deleteService }) => {
  const [isNewServiceDialogOpen, setIsNewServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const { toast } = useToast();

  const handleSaveService = (serviceData, serviceId) => {
    if (serviceId) {
      updateService(serviceId, serviceData);
      toast({ title: 'Servicio Actualizado' });
      setEditingService(null);
    } else {
      addService(serviceData.name, serviceData.departmentId, serviceData.avgTime);
      toast({ title: 'Servicio Creado' });
      setIsNewServiceDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Servicios</h2>
        <Dialog open={isNewServiceDialogOpen} onOpenChange={setIsNewServiceDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Servicio</DialogTitle>
            </DialogHeader>
            <ServiceForm onSave={handleSaveService} departments={departments} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Lista de Servicios</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-slate-700">{service.name}</p>
                <p className="text-sm text-slate-500">
                  Departamento: {departments.find(d => d.id === service.departmentId)?.name || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{service.avgTime} min</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => setEditingService(service)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará el servicio permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteService(service.id)}>
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
          {services.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Settings className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>No hay servicios configurados.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editingService} onOpenChange={(isOpen) => !isOpen && setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
          </DialogHeader>
          {editingService && <ServiceForm onSave={handleSaveService} initialData={editingService} departments={departments} isEdit={true} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManagement;