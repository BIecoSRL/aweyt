import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const useQueueSystem = (currentUser) => {
  const [isSystemActive, setIsSystemActive] = useState(true);
  const { toast } = useToast();

  const updateLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  };

  const addDepartment = (name) => {
    if (!currentUser || !currentUser.companyId) {
        toast({ title: "Error", description: "No se pudo identificar la empresa del usuario.", variant: "destructive" });
        return;
    }
    const newDepartment = {
      id: Date.now(),
      name,
      companyId: currentUser.companyId,
      color: ['bg-orange-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500'][Math.floor(Math.random() * 4)],
      waitingCount: 0,
      averageTime: 5,
      active: true,
    };
    const currentDepartments = JSON.parse(localStorage.getItem('queueSystem_departments')) || [];
    updateLocalStorage('queueSystem_departments', [...currentDepartments, newDepartment]);
    toast({ title: "Departamento añadido", description: `"${name}" ha sido creado.` });
  };

  const addService = (name, departmentId, avgTime) => {
    if (!currentUser || !currentUser.companyId) {
        toast({ title: "Error", description: "No se pudo identificar la empresa del usuario.", variant: "destructive" });
        return;
    }
    const newService = { 
        id: Date.now(), 
        name, 
        departmentId: parseInt(departmentId), 
        avgTime: parseInt(avgTime),
        companyId: currentUser.companyId,
        active: true,
    };
    const currentServices = JSON.parse(localStorage.getItem('queueSystem_services')) || [];
    updateLocalStorage('queueSystem_services', [...currentServices, newService]);
    toast({ title: "Servicio añadido", description: `"${name}" ha sido creado.` });
  };

  const updateService = (serviceId, serviceData) => {
    if (!currentUser || !currentUser.companyId) {
        toast({ title: "Error", description: "No se pudo identificar la empresa del usuario.", variant: "destructive" });
        return;
    }
    const currentServices = JSON.parse(localStorage.getItem('queueSystem_services')) || [];
    const updatedServices = currentServices.map(s => 
      s.id === serviceId 
        ? { ...s, ...serviceData, companyId: currentUser.companyId } 
        : s
    );
    updateLocalStorage('queueSystem_services', updatedServices);
  };

  const getNextTicketId = () => {
    let currentId = parseInt(localStorage.getItem('aweyt_ticket_id_counter') || '0', 10);
    currentId += 1;
    localStorage.setItem('aweyt_ticket_id_counter', currentId.toString());
    return currentId;
  };

  const getNextSequenceNumber = (departmentId) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let counters = JSON.parse(localStorage.getItem('aweyt_ticket_counters')) || {};

    if (!counters || counters.date !== todayStr) {
      counters = { date: todayStr, counters: {} };
    }

    const currentSequence = counters.counters[departmentId] || 0;
    const nextSequence = currentSequence + 1;
    counters.counters[departmentId] = nextSequence;

    localStorage.setItem('aweyt_ticket_counters', JSON.stringify(counters));
    return nextSequence;
  };

  const _internalGenerateTicket = useCallback((pServiceId, customerId, redirectedFromDeptName = null, originalTicketNumber = null) => {
      const allServices = JSON.parse(localStorage.getItem('queueSystem_services')) || [];
      const allDepartments = JSON.parse(localStorage.getItem('queueSystem_departments')) || [];
      
      const service = allServices.find(s => s.id === pServiceId);
      if (!service) return null;
      
      const department = allDepartments.find(d => d.id === service.departmentId);
      if (!department) return null;

      const sequenceNumber = originalTicketNumber 
          ? parseInt(originalTicketNumber.slice(1), 10)
          : getNextSequenceNumber(department.id);

      const prefix = department.name ? department.name.charAt(0).toUpperCase() : 'T';
      const formattedNumber = `${prefix}${sequenceNumber.toString().padStart(3, '0')}`;

      const newTicket = {
        id: getNextTicketId(),
        departmentId: department.id,
        serviceId: pServiceId,
        customerId,
        number: formattedNumber,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        departmentName: department.name,
        serviceName: service.name,
        companyId: service.companyId,
        calledAt: null,
        servedAt: null,
        completedAt: null,
        servedBy: null,
        redirectedFrom: redirectedFromDeptName,
      };
      
      const currentTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
      updateLocalStorage('queueSystem_tickets', [...currentTickets, newTicket]);

      const updatedDepartments = allDepartments.map(d => 
        d.id === department.id 
          ? { ...d, waitingCount: (d.waitingCount || 0) + 1 }
          : d
      );
      updateLocalStorage('queueSystem_departments', updatedDepartments);
      
      return newTicket;
  }, []);
  
  const generateTicket = useCallback((serviceId, customerId) => {
    const allServices = JSON.parse(localStorage.getItem('queueSystem_services')) || [];
    const allDepartments = JSON.parse(localStorage.getItem('queueSystem_departments')) || [];
    
    const service = allServices.find(s => s.id === serviceId);
    if (!service || !service.active) {
      toast({ title: "Error", description: "Servicio no encontrado o inactivo.", variant: "destructive" });
      return null;
    }

    if (!service.departmentId) {
      toast({ title: "Error de configuración", description: "El servicio no está asignado a ningún departamento.", variant: "destructive" });
      return null;
    }

    const department = allDepartments.find(d => d.id === service.departmentId);
    if (!department || !department.active) {
      toast({ title: "Error de configuración", description: "El departamento asignado al servicio está inactivo.", variant: "destructive" });
      return null;
    }

    const newTicket = _internalGenerateTicket(serviceId, customerId);
    if (newTicket) {
      toast({
        title: "¡Ticket generado!",
        description: `Turno ${newTicket.number} para ${newTicket.departmentName}.`,
      });
    }
    return newTicket;
  }, [_internalGenerateTicket, toast]);

  const callTicket = (ticketId) => {
    let currentTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
    const ticketToCall = currentTickets.find(t => t.id === ticketId);
    
    if (!ticketToCall) {
      toast({ title: "Error", description: "El ticket no fue encontrado.", variant: "destructive" });
      return;
    }

    if (ticketToCall.status !== 'waiting') {
      toast({ title: "Acción no válida", description: `Este ticket ya está en estado "${ticketToCall.status}".`, variant: "destructive" });
      return;
    }

    toast({ title: "¡Ticket llamado!", description: `Llamando turno ${ticketToCall.number} para ${ticketToCall.departmentName}.` });
    
    const updatedTickets = currentTickets.map(t => 
      t.id === ticketId 
        ? { ...t, status: 'called', calledAt: new Date().toISOString(), servedBy: currentUser.id }
        : t
    );
    updateLocalStorage('queueSystem_tickets', updatedTickets);
  };

  const serveTicket = (ticketId) => {
    let currentTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
    const ticketToServe = currentTickets.find(t => t.id === ticketId);
    if (!ticketToServe || ticketToServe.status !== 'called') {
      toast({ title: "Acción no válida", description: "Este ticket no se puede atender en este momento.", variant: "destructive" });
      return;
    }

    let currentDepartments = JSON.parse(localStorage.getItem('queueSystem_departments')) || [];
    const updatedDepartments = currentDepartments.map(d => 
      d.id === ticketToServe.departmentId 
        ? { ...d, waitingCount: Math.max(0, (d.waitingCount || 0) - 1) }
        : d
    );
    updateLocalStorage('queueSystem_departments', updatedDepartments);
    
    toast({ title: "¡Atendiendo ticket!", description: `Atendiendo turno #${ticketToServe.number}.` });
    
    const updatedTickets = currentTickets.map(t => 
      t.id === ticketId 
        ? { ...t, status: 'serving', servedAt: new Date().toISOString() }
        : t
    );
    updateLocalStorage('queueSystem_tickets', updatedTickets);
  };

  const completeTicket = (ticketId) => {
    let currentTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
    const updatedTickets = currentTickets.map(t => 
      t.id === ticketId 
        ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
        : t
    );
    updateLocalStorage('queueSystem_tickets', updatedTickets);
    toast({ title: "¡Ticket completado!", description: "El servicio ha sido completado." });
  };

  const cancelTicket = (ticketId) => {
    let currentTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
    const updatedTickets = currentTickets.map(t =>
      t.id === ticketId
        ? { ...t, status: 'cancelled', completedAt: new Date().toISOString(), servedBy: currentUser.id }
        : t
    );
    updateLocalStorage('queueSystem_tickets', updatedTickets);
    toast({ title: "Ticket cancelado", description: "El ticket ha sido marcado como cancelado." });
  };

  const redirectTicket = (ticketId, newDepartmentId, newServiceId) => {
    let currentTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
    const ticketToRedirect = currentTickets.find(t => t.id === ticketId);
    if (!ticketToRedirect) return;

    const updatedOldTicketList = currentTickets.map(t => 
      t.id === ticketId 
        ? { 
            ...t, 
            status: 'redirected',
            completedAt: new Date().toISOString(),
            servedBy: currentUser.id,
          } 
        : t
    );
    // Don't update local storage yet, do it after new ticket is created
    // to avoid race conditions with _internalGenerateTicket

    const newTicket = _internalGenerateTicket(newServiceId, ticketToRedirect.customerId, ticketToRedirect.departmentName, ticketToRedirect.number);
    
    if(newTicket){
        // The _internalGenerateTicket already updated the tickets list with the new ticket
        // Now we just need to make sure the old one is marked as redirected
        let finalTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
        finalTickets = finalTickets.map(t => t.id === ticketId ? updatedOldTicketList.find(x => x.id === t.id) || t : t);
        updateLocalStorage('queueSystem_tickets', finalTickets);

        toast({ title: "¡Ticket redirigido!", description: `El turno #${ticketToRedirect.number} ha sido movido a un nuevo departamento.` });
    }
  };


  const deleteTicketHistory = (ticketId) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
      toast({ title: "Acción no permitida", description: "Solo los administradores pueden eliminar el historial.", variant: "destructive" });
      return;
    }
    let currentTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
    const updatedTickets = currentTickets.filter(t => t.id !== ticketId);
    updateLocalStorage('queueSystem_tickets', updatedTickets);
    toast({ title: "Registro eliminado", description: "El registro del ticket ha sido eliminado del historial." });
  };

  return {
    isSystemActive,
    setIsSystemActive,
    addDepartment,
    addService,
    updateService,
    generateTicket,
    callTicket,
    serveTicket,
    completeTicket,
    cancelTicket,
    redirectTicket,
    deleteTicketHistory,
  };
};

export default useQueueSystem;