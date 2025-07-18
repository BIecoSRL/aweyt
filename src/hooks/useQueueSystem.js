import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const useQueueSystem = (currentUser) => {
  const [departments, setDepartments] = useState(() => JSON.parse(localStorage.getItem('queueSystem_departments')) || []);
  const [services, setServices] = useState(() => JSON.parse(localStorage.getItem('queueSystem_services')) || []);
  const [tickets, setTickets] = useState(() => JSON.parse(localStorage.getItem('queueSystem_tickets')) || []);
  const [isSystemActive, setIsSystemActive] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('queueSystem_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('queueSystem_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('queueSystem_tickets', JSON.stringify(tickets));
    window.dispatchEvent(new Event('storage'));
  }, [tickets]);

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
    setDepartments([...departments, newDepartment]);
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
    setServices([...services, newService]);
    toast({ title: "Servicio añadido", description: `"${name}" ha sido creado.` });
  };

  const updateService = (serviceId, serviceData) => {
    if (!currentUser || !currentUser.companyId) {
        toast({ title: "Error", description: "No se pudo identificar la empresa del usuario.", variant: "destructive" });
        return;
    }
    setServices(services => services.map(s => 
      s.id === serviceId 
        ? { ...s, ...serviceData, companyId: currentUser.companyId } 
        : s
    ));
  };

  const _internalGenerateTicket = (pServiceId, customerId, redirectedFromDeptName = null, originalTicketNumber = null) => {
      const allServices = JSON.parse(localStorage.getItem('queueSystem_services')) || [];
      const allDepartments = JSON.parse(localStorage.getItem('queueSystem_departments')) || [];
      const allTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
      
      const service = allServices.find(s => s.id === pServiceId);
      if (!service) return null;
      
      const department = allDepartments.find(d => d.id === service.departmentId);
      if (!department) return null;

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todaysTicketsForDept = allTickets.filter(t => 
          t.departmentId === department.id &&
          t.createdAt.startsWith(todayStr)
      );
      
      const sequenceNumber = originalTicketNumber 
          ? parseInt(originalTicketNumber.slice(1), 10)
          : todaysTicketsForDept.length + 1;

      const prefix = department.name ? department.name.charAt(0).toUpperCase() : 'T';
      const formattedNumber = `${prefix}${sequenceNumber.toString().padStart(3, '0')}`;

      const newTicket = {
        id: Date.now(),
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

      setTickets(prevTickets => [...prevTickets, newTicket]);
      setDepartments(depts => depts.map(d => 
        d.id === department.id 
          ? { ...d, waitingCount: (d.waitingCount || 0) + 1 }
          : d
      ));
      
      return newTicket;
  };
  
  const generateTicket = (serviceId, customerId) => {
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
  };

  const callTicket = (ticketId) => {
    setTickets(tickets => {
      const ticketToCall = tickets.find(t => t.id === ticketId);
      if (!ticketToCall || ticketToCall.status !== 'waiting') {
        toast({ title: "Acción no válida", description: "Este ticket no se puede llamar.", variant: "destructive" });
        return tickets;
      }
      toast({ title: "¡Ticket llamado!", description: `Llamando turno ${ticketToCall.number} para ${ticketToCall.departmentName}.` });
      return tickets.map(t => 
        t.id === ticketId 
          ? { ...t, status: 'called', calledAt: new Date().toISOString(), servedBy: currentUser.id }
          : t
      );
    });
  };

  const serveTicket = (ticketId) => {
    setTickets(tickets => {
        const ticketToServe = tickets.find(t => t.id === ticketId);
        if (!ticketToServe || ticketToServe.status !== 'called') {
          toast({ title: "Acción no válida", description: "Este ticket no se puede atender en este momento.", variant: "destructive" });
          return tickets;
        }

        setDepartments(depts => depts.map(d => 
          d.id === ticketToServe.departmentId 
            ? { ...d, waitingCount: Math.max(0, (d.waitingCount || 0) - 1) }
            : d
        ));
        
        toast({ title: "¡Atendiendo ticket!", description: `Atendiendo turno #${ticketToServe.number}.` });
        
        return tickets.map(t => 
          t.id === ticketId 
            ? { ...t, status: 'serving', servedAt: new Date().toISOString() }
            : t
        );
    });
  };

  const completeTicket = (ticketId) => {
    setTickets(tickets.map(t => 
      t.id === ticketId 
        ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
        : t
    ));
    toast({ title: "¡Ticket completado!", description: "El servicio ha sido completado." });
  };

  const cancelTicket = (ticketId) => {
    setTickets(tickets.map(t =>
      t.id === ticketId
        ? { ...t, status: 'cancelled', completedAt: new Date().toISOString(), servedBy: currentUser.id }
        : t
    ));
    toast({ title: "Ticket cancelado", description: "El ticket ha sido marcado como cancelado." });
  };

  const redirectTicket = (ticketId, newDepartmentId, newServiceId) => {
    const ticketToRedirect = tickets.find(t => t.id === ticketId);
    if (!ticketToRedirect) return;

    setTickets(prevTickets => prevTickets.map(t => 
      t.id === ticketId 
        ? { 
            ...t, 
            status: 'redirected',
            completedAt: new Date().toISOString(),
            servedBy: currentUser.id,
          } 
        : t
    ));

    _internalGenerateTicket(newServiceId, ticketToRedirect.customerId, ticketToRedirect.departmentName, ticketToRedirect.number);

    toast({ title: "¡Ticket redirigido!", description: `El turno #${ticketToRedirect.number} ha sido movido a un nuevo departamento.` });
  };


  const deleteTicketHistory = (ticketId) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
      toast({ title: "Acción no permitida", description: "Solo los administradores pueden eliminar el historial.", variant: "destructive" });
      return;
    }
    const updatedTickets = tickets.filter(t => t.id !== ticketId);
    setTickets(updatedTickets);
    toast({ title: "Registro eliminado", description: "El registro del ticket ha sido eliminado del historial." });
  };

  return {
    departments,
    services,
    tickets,
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