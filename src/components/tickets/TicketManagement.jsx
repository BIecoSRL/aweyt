
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, UserCheck, Send, PlayCircle, XCircle, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TicketManagement = ({ tickets, allCompanyDepartments, services, completeTicket, redirectTicket, cancelTicket, callTicket, serveTicket, currentUser }) => {
  const [redirectData, setRedirectData] = useState({ ticket: null, departmentId: '', serviceId: '' });

  const handleRedirectConfirm = () => {
    if (redirectData.ticket && redirectData.departmentId && redirectData.serviceId) {
      redirectTicket(redirectData.ticket.id, parseInt(redirectData.departmentId), parseInt(redirectData.serviceId));
      setRedirectData({ ticket: null, departmentId: '', serviceId: '' });
    }
  };
  
  const handleOpenRedirect = (ticket) => {
    setRedirectData({ ticket, departmentId: '', serviceId: '' });
  };
  
  const handleCloseRedirect = () => {
    setRedirectData({ ticket: null, departmentId: '', serviceId: '' });
  };
  
  const relevantServices = useMemo(() => {
    if (!redirectData.departmentId) return [];
    const allServices = JSON.parse(localStorage.getItem('queueSystem_services')) || [];
    return allServices.filter(s => s.departmentId === parseInt(redirectData.departmentId));
  }, [redirectData.departmentId]);

  const activeTickets = useMemo(() => {
    return tickets.filter(t => {
      if (currentUser.role === 'admin') {
        return ['waiting', 'called', 'serving'].includes(t.status) && t.companyId === currentUser.companyId;
      }
      const userDeptIds = currentUser.departmentIds || [];
      const isWaitingInMyDept = ['waiting', 'called'].includes(t.status) && userDeptIds.includes(t.departmentId);
      const isServedByMe = t.status === 'serving' && t.servedBy === currentUser.id;
      return isWaitingInMyDept || isServedByMe;
    }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [tickets, currentUser]);

  const getStatusPill = (status) => {
    switch (status) {
      case 'waiting':
        return <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Esperando</div>;
      case 'called':
        return <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">Llamado</div>;
      case 'serving':
        return <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Atendiendo</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Gestión de Tickets</h2>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Mis Tickets Activos</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {activeTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-blue-600">#{ticket.number}</div>
                  <div>
                    <p className="font-medium text-slate-700">{ticket.departmentName}</p>
                    <p className="text-sm text-slate-500">
                      Servicio: {ticket.serviceName}
                    </p>
                     <p className="text-sm text-slate-500">
                      Cliente: {ticket.customerId}
                    </p>
                    {ticket.redirectedFrom && <p className="text-xs text-orange-600 mt-1">Redirigido de: {ticket.redirectedFrom}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusPill(ticket.status)}
                  
                  {ticket.status === 'waiting' && (
                    <Button onClick={() => callTicket(ticket.id)} size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700">
                      <Megaphone className="h-4 w-4 mr-2" />
                      Llamar
                    </Button>
                  )}

                  {ticket.status === 'called' && (
                    <Button onClick={() => serveTicket(ticket.id)} size="sm">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Atender
                    </Button>
                  )}

                  {ticket.status === 'serving' && (
                    <>
                      <Button onClick={() => completeTicket(ticket.id)} size="sm" className="bg-green-600 hover:bg-green-700">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Completar
                      </Button>

                      <Dialog open={!!redirectData.ticket && redirectData.ticket.id === ticket.id} onOpenChange={(isOpen) => !isOpen && handleCloseRedirect()}>
                        <DialogTrigger asChild>
                          <Button onClick={() => handleOpenRedirect(ticket)} size="sm" variant="outline">
                            <Send className="h-4 w-4 mr-2" />
                            Redirigir
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Redirigir Ticket #{ticket.number}</DialogTitle>
                            <DialogDescription>Transfiere este ticket a otro departamento y servicio.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4 grid gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Departamento de destino:</label>
                                <Select onValueChange={(val) => setRedirectData(d => ({ ...d, departmentId: val, serviceId: '' }))} value={redirectData.departmentId}>
                                  <SelectTrigger><SelectValue placeholder="Seleccionar departamento..." /></SelectTrigger>
                                  <SelectContent>
                                    {(allCompanyDepartments || []).filter(d => d.id !== ticket.departmentId).map(d => (
                                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                            {redirectData.departmentId && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nuevo servicio:</label>
                                    <Select onValueChange={(val) => setRedirectData(d => ({...d, serviceId: val}))} value={redirectData.serviceId}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar servicio..." /></SelectTrigger>
                                    <SelectContent>
                                        {relevantServices.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button onClick={handleRedirectConfirm} className="w-full" disabled={!redirectData.departmentId || !redirectData.serviceId}>
                              Confirmar Redirección
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button onClick={() => cancelTicket(ticket.id)} size="sm" variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {activeTickets.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>No tienes tickets activos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketManagement;
