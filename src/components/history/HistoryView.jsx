
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, User, Clock, Calendar, Filter, CheckCircle, XCircle, Send, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO, differenceInMinutes, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';


const HistoryView = ({ currentUser, deleteTicketHistory, ...props }) => {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);

  const { tickets, services, users } = props;

  const [filters, setFilters] = useState({
    employee: 'all',
    service: 'all',
    status: 'all',
    date: null
  });

  useEffect(() => {
    if(tickets !== undefined && services !== undefined && users !== undefined) {
      setLoading(false);
    }
  }, [tickets, services, users]);
  
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      setFilters(prev => ({ ...prev, employee: currentUser.id.toString() }));
    } else {
      setFilters(prev => ({ ...prev, employee: 'all' }));
    }
  }, [currentUser]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const historicalTickets = useMemo(() => {
    if (!tickets || !currentUser) return [];
    
    return tickets
      .filter(t => t.companyId === currentUser.companyId && ['completed', 'cancelled', 'redirected'].includes(t.status))
      .sort((a, b) => {
          const dateA = new Date(a.completedAt || a.createdAt);
          const dateB = new Date(b.completedAt || b.createdAt);
          return dateB - dateA;
      });
  }, [tickets, currentUser]);
  
  const filteredUsersForSelect = useMemo(() => {
    if (!users || !currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        return users.filter(u => u.role !== 'customer');
    }
    return users.filter(u => u.id === currentUser.id);
  }, [users, currentUser]);

  const filteredServicesForSelect = useMemo(() => {
    if (!services || !currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        return services;
    }
    const userDeptIds = currentUser.departmentIds || [];
    return services.filter(s => userDeptIds.includes(s.departmentId));
  }, [services, currentUser]);

  const filteredTickets = useMemo(() => {
    return historicalTickets.filter(ticket => {
      const employeeMatch = filters.employee === 'all' || ticket.servedBy === parseInt(filters.employee, 10);
      const serviceMatch = filters.service === 'all' || ticket.serviceId === parseInt(filters.service, 10);
      const statusMatch = filters.status === 'all' || ticket.status === filters.status;
      const dateMatch = !filters.date || isWithinInterval(parseISO(ticket.completedAt || ticket.createdAt), {
        start: startOfDay(filters.date),
        end: endOfDay(filters.date)
      });
      return employeeMatch && serviceMatch && statusMatch && dateMatch;
    });
  }, [historicalTickets, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-4 text-slate-500">Cargando datos del historial...</p>
      </div>
    );
  }

  const getEmployeeName = (userId) => {
    if (!users) return 'Sistema';
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Sistema';
  };

  const getStatusInfo = (ticket) => {
    if (ticket.status === 'completed') {
      if (!ticket.servedAt || !ticket.completedAt) return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: `Completado` };
      const duration = differenceInMinutes(parseISO(ticket.completedAt), parseISO(ticket.servedAt));
      return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: `Completado en ${duration} min` };
    }
    if (ticket.status === 'cancelled') {
      return { icon: <XCircle className="h-5 w-5 text-red-500" />, text: 'Cancelado' };
    }
    if (ticket.status === 'redirected') {
        return { icon: <Send className="h-5 w-5 text-yellow-500" />, text: `Redirigido` };
    }
    return { icon: <Clock className="h-5 w-5 text-slate-400" />, text: 'N/A' };
  };

  const getCompliance = (ticket) => {
    if (ticket.status !== 'completed' || !ticket.servedAt) return { text: 'N/A', color: 'text-slate-400' };
    const service = services.find(s => s.id === ticket.serviceId);
    if (!service || !service.avgTime) return { text: 'N/A', color: 'text-slate-400' };

    const estimatedTime = service.avgTime;
    const realTime = differenceInMinutes(parseISO(ticket.completedAt), parseISO(ticket.servedAt));
    
    if (realTime <= 0) return { text: '100%', color: 'text-green-600' };
    
    if (realTime <= estimatedTime) {
        return { text: '100%', color: 'text-green-600' };
    }

    const percentage = (1 - (realTime - estimatedTime) / estimatedTime) * 100;
    const cappedPercentage = Math.max(0, Math.min(percentage, 100));
    
    let color = 'text-green-600';
    if (cappedPercentage < 80) color = 'text-yellow-600';
    if (cappedPercentage < 50) color = 'text-red-600';

    return { text: `${cappedPercentage.toFixed(0)}%`, color };
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Reporte Histórico de Tickets", 14, 22);
    doc.setFontSize(12);
    doc.text(`Empresa: ${company?.name || 'N/A'}`, 14, 30);
    doc.text(`Fecha de Reporte: ${format(new Date(), 'dd MMM yyyy', { locale: es })}`, 14, 36);

    const tableColumn = ["# Ticket", "Cliente", "Servicio", "Empleado", "Estado", "Fecha", "T. Real", "T. Estimado", "Cumplimiento"];
    const tableRows = [];

    filteredTickets.forEach(ticket => {
        const service = services.find(s => s.id === ticket.serviceId);
        const realTime = ticket.status === 'completed' && ticket.servedAt ? `${differenceInMinutes(parseISO(ticket.completedAt), parseISO(ticket.servedAt))} min` : 'N/A';
        const estimatedTime = service ? `${service.avgTime} min` : 'N/A';
        const compliance = getCompliance(ticket).text;

        const ticketData = [
            `#${ticket.number}`,
            ticket.customerId,
            ticket.serviceName,
            getEmployeeName(ticket.servedBy),
            ticket.status,
            format(parseISO(ticket.completedAt || ticket.createdAt), 'dd/MM/yy HH:mm'),
            realTime,
            estimatedTime,
            compliance
        ];
        tableRows.push(ticketData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
    });
    
    doc.save(`reporte_historico_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Historial de Tickets</h2>
        <Button onClick={exportPDF} variant="outline" disabled={filteredTickets.length === 0}>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

       <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-3 rounded-lg">
          <Filter className="h-5 w-5 text-slate-500" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[200px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date ? format(filters.date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.date}
                onSelect={(date) => handleFilterChange('date', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select onValueChange={(v) => handleFilterChange('employee', v)} value={filters.employee} disabled={currentUser.role !== 'admin' && currentUser.role !== 'superadmin'}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Empleado" /></SelectTrigger>
            <SelectContent>
              {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && <SelectItem value="all">Todos los empleados</SelectItem>}
              {filteredUsersForSelect.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>{user.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => handleFilterChange('service', v)} value={filters.service}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Servicio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              {filteredServicesForSelect.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => handleFilterChange('status', v)} value={filters.status}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="redirected">Redirigido</SelectItem>
            </SelectContent>
          </Select>
           <Button onClick={() => setFilters({ employee: (currentUser.role === 'admin' || currentUser.role === 'superadmin') ? 'all' : currentUser.id.toString(), service: 'all', status: 'all', date: null })} variant="ghost">Limpiar</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <ScrollArea className="h-[60vh]">
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2 flex items-center gap-4">
                     <div className="text-2xl font-bold text-blue-600">#{ticket.number}</div>
                      <div>
                          <p className="font-medium text-slate-700">{ticket.serviceName}</p>
                          <p className="text-sm text-slate-500">Cliente: {ticket.customerId}</p>
                      </div>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-slate-600" title="Empleado">
                      <User className="h-4 w-4" />
                      <span>{getEmployeeName(ticket.servedBy)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" title="Estado">
                      {getStatusInfo(ticket).icon}
                      <span className="text-slate-700">{getStatusInfo(ticket).text}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-semibold ${getCompliance(ticket).color}`} title="Cumplimiento">
                     <span>{getCompliance(ticket).text}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-col text-right text-xs text-slate-500">
                          <span>{format(parseISO(ticket.completedAt || ticket.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                          <span>{format(parseISO(ticket.completedAt || ticket.createdAt), 'HH:mm:ss', { locale: es })}</span>
                      </div>
                      {currentUser.role === 'admin' && (
                          <Button onClick={() => deleteTicketHistory(ticket.id)} size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p>No hay registros históricos que coincidan con los filtros.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default HistoryView;
