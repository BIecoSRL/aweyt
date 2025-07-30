import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Users, Clock, Printer, AlertTriangle, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import useQueueSystem from '@/hooks/useQueueSystem';

const CustomerView = () => {
  const { companySlug } = useParams();
  const [allCompanies, setAllCompanies] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const { generateTicket } = useQueueSystem(null);
  
  const [step, setStep] = useState('id_input');
  const [customerId, setCustomerId] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [viewReady, setViewReady] = useState(false);
  const { toast } = useToast();
  const ticketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Manually load data from localStorage to ensure it's fresh
    const loadData = () => {
      setAllCompanies(JSON.parse(localStorage.getItem('aweyt_companies')) || []);
      setAllServices(JSON.parse(localStorage.getItem('queueSystem_services')) || []);
      setAllDepartments(JSON.parse(localStorage.getItem('queueSystem_departments')) || []);
      setAllTickets(JSON.parse(localStorage.getItem('queueSystem_tickets')) || []);
      setViewReady(true);
    };

    loadData();

    // Listen for storage changes to update data if needed elsewhere
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const { company, companyServices, companyDepartments, companyTickets } = useMemo(() => {
    const company = allCompanies.find(c => c.slug === companySlug);
    if (!company) {
      return { company: null, companyServices: [], companyDepartments: [], companyTickets: [] };
    }

    const companyServices = allServices.filter(s => s.companyId === company.id && s.active);
    const serviceDepartmentIds = new Set(companyServices.map(s => s.departmentId));
    const companyDepartments = allDepartments.filter(d => d.companyId === company.id && serviceDepartmentIds.has(d.id));
    const companyTickets = allTickets.filter(t => t.companyId === company.id);
    
    return { company, companyServices, companyDepartments, companyTickets };
  }, [companySlug, allServices, allDepartments, allTickets, allCompanies]);

  if (!viewReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-slate-500">Cargando datos de la empresa...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-slate-50">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4"/>
        <h1 className="text-2xl font-bold text-red-600">Empresa no encontrada</h1>
        <p className="text-slate-500">El enlace que has seguido no es válido.</p>
        <Button onClick={() => navigate('/login')} variant="link" className="mt-4">Volver al inicio</Button>
      </div>
    );
  }

  const handleIdSubmit = () => {
    if (!customerId.trim()) {
      toast({
        title: "Identificación requerida",
        description: "Por favor, ingresa tu cédula o pasaporte.",
        variant: "destructive",
      });
      return;
    }
    setStep('service_selection');
  };

  const handleServiceSelect = (service) => {
    const newTicket = generateTicket(service.id, customerId);
    if (newTicket) {
      setGeneratedTicket(newTicket);
      setStep('ticket_view');
    } else {
       toast({
        title: "Error al generar ticket",
        description: "No se pudo crear el ticket. Es posible que el servicio o departamento no esté configurado correctamente.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (step === 'service_selection') {
      setStep('id_input');
    } else if (step === 'ticket_view') {
      setStep('id_input');
      setCustomerId('');
      setGeneratedTicket(null);
    } else {
      navigate(-1);
    }
  };
  
  const handlePrint = () => {
    const ticketNode = ticketRef.current;
    if (!ticketNode) return;

    const logoSrc = ticketNode.querySelector('.company-logo')?.src || '';
    const companyName = ticketNode.querySelector('.company-name').textContent;
    const ticketNumber = ticketNode.querySelector('.ticket-number').textContent;
    const details = Array.from(ticketNode.querySelectorAll('.detail-item')).map(item => {
        const label = item.querySelector('.detail-label').textContent;
        const value = item.querySelector('.detail-value').textContent;
        return { label, value };
    });

    const printWindow = window.open('', '', 'height=600,width=400');
    printWindow.document.write('<html><head><title>Ticket</title>');
    printWindow.document.write(`
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page {
          size: 80mm auto; /* For 80mm thermal paper */
          margin: 5mm;
        }
        body { 
          font-family: 'Courier New', Courier, monospace;
          text-align: center; 
          margin: 0; 
          padding: 0;
          color: #000;
          width: 70mm; /* Adjust width slightly less than paper */
        }
        .ticket-wrapper { 
          width: 100%; 
        }
        img.logo { 
          max-width: 50mm; 
          max-height: 25mm; 
          margin: 0 auto 5mm;
        }
        .company { font-size: 14pt; font-weight: bold; margin-bottom: 5mm; }
        .turn-label { font-size: 14pt; margin-bottom: 2mm; }
        .ticket-num { font-size: 36pt; font-weight: bold; line-height: 1; margin-bottom: 5mm; }
        .details { text-align: left; font-size: 10pt; width: 100%; margin: 5mm 0; }
        .details p { margin: 2mm 0; }
        .details strong { float: left; width: 50%;}
        .details span { float: right; width: 50%; text-align: right; }
        .separator { border-top: 1px dashed #000; margin: 5mm 0; clear: both; }
        .footer { font-size: 9pt; margin-top: 5mm; }
      </style>
    `);
    printWindow.document.write('</head><body><div class="ticket-wrapper">');
    if (logoSrc) {
        printWindow.document.write(`<img src="${logoSrc}" class="logo" alt="Logo"/>`);
    }
    printWindow.document.write(`<p class="company">${companyName}</p>`);
    printWindow.document.write(`<p class="turn-label">SU TURNO</p>`);
    printWindow.document.write(`<h1 class="ticket-num">${ticketNumber}</h1>`);
    printWindow.document.write('<div class="separator"></div>');
    
    printWindow.document.write('<div class="details">');
    details.forEach(detail => {
        printWindow.document.write(`<p><strong>${detail.label}</strong><span>${detail.value}</span></p>`);
    });
    printWindow.document.write('</div>');

    printWindow.document.write('<div class="separator"></div>');
    printWindow.document.write(`<p class="footer">¡Gracias por su visita!</p>`);
    
    printWindow.document.write('</div></body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const peopleAhead = generatedTicket
    ? companyTickets.filter(t =>
        t.departmentId === generatedTicket.departmentId &&
        t.status === 'waiting' &&
        new Date(t.createdAt).getTime() < new Date(generatedTicket.createdAt).getTime()
      ).length
    : 0;
    
  const departmentForTicket = generatedTicket ? companyDepartments.find(d => d.id === generatedTicket.departmentId) : null;
  const companyInfo = company || { name: "Aweyt", logo: "" };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-slate-50">
      <Button onClick={handleBack} variant="ghost" className="absolute top-6 left-6 z-10">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <AnimatePresence mode="wait">
        {step === 'id_input' && (
          <motion.div
            key="id_input"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-full max-w-md text-center"
          >
            {companyInfo.logo && <img  src={companyInfo.logo} alt={`Logo de ${companyInfo.name}`} className="h-16 mx-auto mb-4" />}
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Bienvenido a {companyInfo.name}</h1>
            <p className="text-lg text-slate-500 mb-8">Ingresa tu cédula o pasaporte para comenzar.</p>
            <div className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Cédula o Pasaporte"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="text-center text-lg h-14"
              />
              <Button onClick={handleIdSubmit} size="lg">
                Siguiente <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'service_selection' && (
          <motion.div
            key="service"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-full max-w-4xl text-center"
          >
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Selecciona un Servicio</h1>
            <p className="text-lg text-slate-500 mb-8">Hola, {customerId}. Elige el servicio que necesitas.</p>
            {companyServices && companyServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyServices.map(service => (
                    <motion.div key={service.id} whileHover={{ scale: 1.03, y: -5 }} className="cursor-pointer" onClick={() => handleServiceSelect(service)}>
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center h-full flex flex-col justify-between hover:shadow-lg hover:border-blue-400 transition-all duration-300">
                        <div>
                          <Ticket className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                          <p className="text-xl font-bold text-slate-800">{service.name}</p>
                          <p className="text-sm text-slate-500 mb-3">{companyDepartments.find(d => d.id === service.departmentId)?.name}</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mt-2">
                          <Clock className="h-4 w-4" />
                          <span>Tiempo estimado: {service.avgTime} min</span>
                        </div>
                      </div>
                    </motion.div>
                ))}
                </div>
            ) : (
                <div className="mt-12 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-6 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 mr-4" />
                    <div>
                        <h3 className="font-bold">No hay servicios disponibles</h3>
                        <p>Esta empresa aún no ha configurado sus servicios. Por favor, intente más tarde.</p>
                    </div>
                </div>
            )}
          </motion.div>
        )}

        {step === 'ticket_view' && generatedTicket && (
          <motion.div
            key="ticket_view"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full max-w-md text-center"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
                <div ref={ticketRef} className="text-left">
                    {companyInfo.logo && <img  src={companyInfo.logo} alt={`Logo de ${companyInfo.name}`} className="company-logo mx-auto mb-4" style={{ maxHeight: '50px' }} />}
                    <p className="company-name text-center text-lg font-bold">{companyInfo.name}</p>
                    <hr className="my-4 border-dashed" />
                    
                    <p className="text-center text-sm text-slate-500 mb-2">SU TURNO</p>
                    <p className="ticket-number text-center text-7xl font-bold tracking-wider">{generatedTicket.number}</p>
                    <hr className="my-4 border-dashed" />
                    
                    <div className="space-y-1.5 text-sm">
                      <p className="detail-item flex justify-between"><strong className="detail-label text-slate-500">Departamento:</strong> <span className="detail-value font-medium">{generatedTicket.departmentName}</span></p>
                      <p className="detail-item flex justify-between"><strong className="detail-label text-slate-500">Servicio:</strong> <span className="detail-value font-medium">{generatedTicket.serviceName}</span></p>
                      <p className="detail-item flex justify-between"><strong className="detail-label text-slate-500">Fecha y Hora:</strong> <span className="detail-value font-medium">{new Date(generatedTicket.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}</span></p>
                      <p className="detail-item flex justify-between"><strong className="detail-label text-slate-500">Personas delante:</strong> <span className="detail-value font-medium">{peopleAhead}</span></p>
                      <p className="detail-item flex justify-between"><strong className="detail-label text-slate-500">Espera estimada:</strong> <span className="detail-value font-medium">~{peopleAhead * (departmentForTicket?.averageTime || 5)} min</span></p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                    <Button onClick={handlePrint} size="lg" variant="outline" className="w-full">
                        <Printer className="mr-2 h-5 w-5" />
                        Imprimir Ticket
                    </Button>
                    <Button onClick={() => { setStep('id_input'); setCustomerId(''); setGeneratedTicket(null); }} size="lg" className="w-full">
                        <User className="mr-2 h-5 w-5" />
                        Finalizar y Salir
                    </Button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerView;