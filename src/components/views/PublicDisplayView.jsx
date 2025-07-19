import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Building2, Users, Ticket } from 'lucide-react';
import { useParams } from 'react-router-dom';

const PublicDisplayView = () => {
  const [tickets, setTickets] = useState([]);
  const [lastCalledTicket, setLastCalledTicket] = useState(null);
  const [company, setCompany] = useState(null);
  const [config, setConfig] = useState({
    logo: '',
    message: 'Turnos de Atención',
    videoUrl: '',
    images: []
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { companySlug } = useParams();

  useEffect(() => {
    if (companySlug) {
      const companies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
      const currentCompany = companies.find(c => c.slug === companySlug);
      if (currentCompany) {
        setCompany(currentCompany);
        if (currentCompany.screenConfig) {
          setConfig(currentCompany.screenConfig);
        }
      }
    }
  }, [companySlug]);

  useEffect(() => {
    const updateTickets = () => {
      const savedTickets = localStorage.getItem('queueSystem_tickets');
      if (savedTickets && company) {
        const allTickets = JSON.parse(savedTickets);
        const companyTickets = allTickets.filter(t => t.companyId === company.id);
        setTickets(companyTickets);

        const newLastCalled = companyTickets
          .filter(t => t.status === 'called')
          .sort((a, b) => new Date(b.calledAt) - new Date(a.calledAt))[0];

        if (newLastCalled && (!lastCalledTicket || newLastCalled.id !== lastCalledTicket.id)) {
          setLastCalledTicket(newLastCalled);
          
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.error("Error playing sound:", e));
        }
      }
    };

    updateTickets(); 
    const interval = setInterval(updateTickets, 2000);
    window.addEventListener('storage', updateTickets);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateTickets);
    };
  }, [lastCalledTicket, company]);

  useEffect(() => {
    if (config.images && config.images.length > 0) {
      const imageInterval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % config.images.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(imageInterval);
    }
  }, [config.images]);

  const waitingTickets = useMemo(() => {
    return tickets
      .filter(t => t.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 5); // Show up to 5 waiting tickets
  }, [tickets]);

  const backgroundContent = useMemo(() => {
    if (config.videoUrl) {
      return (
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10">
          <source src={config.videoUrl} type="video/mp4" />
        </video>
      );
    }
    if (config.images && config.images.length > 0) {
      return (
        <AnimatePresence>
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute top-0 left-0 w-full h-full bg-cover bg-center -z-10"
            style={{ backgroundImage: `url(${config.images[currentImageIndex]})` }}
          />
        </AnimatePresence>
      );
    }
    return <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 -z-10"></div>;
  }, [config, currentImageIndex]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col p-8 relative overflow-hidden">
      {backgroundContent}
      <div className="absolute inset-0 bg-black/20 -z-10"></div>

      <header className="w-full text-center mb-8 z-10 flex items-center justify-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl">
        {config.logo && <img src={config.logo} alt="Logo" className="h-16" />}
        <h1 className="text-5xl font-bold text-blue-600">{config.message}</h1>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        <motion.div 
          layout
          className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 shadow-lg"
        >
          <AnimatePresence mode="wait">
            {lastCalledTicket ? (
              <motion.div
                key={lastCalledTicket.id}
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
                className="text-center"
              >
                <p className="text-4xl font-medium text-slate-600 mb-4">Turno Actual</p>
                <p className="text-9xl md:text-[12rem] lg:text-[15rem] font-bold text-blue-600 leading-none">
                  {lastCalledTicket.number}
                </p>
                <div className="mt-8 flex items-center justify-center gap-4 text-4xl text-slate-500">
                  <Building2 className="h-12 w-12" />
                  <span>{lastCalledTicket.departmentName}</span>
                </div>
              </motion.div>
            ) : (
              <div className="text-center text-slate-400">
                <Volume2 className="h-32 w-32 mx-auto mb-4" />
                <p className="text-4xl">Esperando el próximo llamado...</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 flex flex-col shadow-lg">
          <h2 className="text-4xl font-semibold mb-6 text-center text-slate-800">En Espera</h2>
          <div className="flex-1 space-y-4">
            <AnimatePresence>
              {waitingTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-slate-100 p-4 rounded-lg flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <Ticket className="h-8 w-8 text-blue-500" />
                    <span className="text-4xl font-bold text-blue-700">{ticket.number}</span>
                  </div>
                  <span className="text-xl text-slate-500 text-right">{ticket.departmentName}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {waitingTickets.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Users className="h-20 w-20 mb-4" />
                <p className="text-2xl">No hay turnos en espera</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="w-full text-center mt-8 text-white z-10 bg-black/30 p-2 rounded-lg">
        <p>Aweyt - {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </footer>
    </div>
  );
};

export default PublicDisplayView;