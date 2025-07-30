import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);

    // Soporte YouTube
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    } else if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    }

    // Soporte Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').filter(Boolean).pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1`;
    }

    // Si ya es un embed directo, úsalo tal cual
    if (url.includes('embed')) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
};
function useDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    time: format(dateTime, 'HH:mm'),
    date: format(dateTime, "eeee, dd 'de' MMMM", { locale: es })
  };
}

const PublicDisplayView = () => {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [company, setCompany] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [systemSettings, setSystemSettings] = useState({});
  const [viewReady, setViewReady] = useState(false);
  const [lastCalledTicket, setLastCalledTicket] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const synth = window.speechSynthesis;
  const utteranceQueue = useRef([]);

  const { time, date } = useDateTime();

  const processQueue = useCallback(() => {
    if (synth.speaking || utteranceQueue.current.length === 0) {
  const hasMultimedia = !!embedUrl || images.length > 0;
    }
    const utterance = utteranceQueue.current.shift();
    utterance.onend = processQueue;
    synth.speak(utterance);
  }, [synth]);

  const speak = useCallback((text) => {
    if (isMuted) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = navigator.language || 'es-ES';
      utteranceQueue.current.push(utterance);
      processQueue();
    } catch (error) {
      console.error("Speech synthesis failed.", error);
    }
  }, [isMuted, processQueue]);

  const toggleMute = () => {
    setIsMuted(prev => {
        const newState = !prev;
        if (!newState) {
            // Unmuting, try to speak something to activate
            synth.cancel(); // Clear any previous attempts
            const utterance = new SpeechSynthesisUtterance("Sonido activado");
            utterance.volume = 0; // Speak silently to unlock
            synth.speak(utterance);
            toast({ title: 'Sonido Activado', description: 'Los anuncios de turnos se escucharán.' });
        } else {
            synth.cancel();
            toast({ title: 'Sonido Desactivado', variant: 'destructive' });
        }
        return newState;
    });
  };

  useEffect(() => {
    const allCompanies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
    const foundCompany = allCompanies.find(c => c.slug === companySlug);
    
    if (!foundCompany) {
      setViewReady(true);
      return;
    }
    
    setCompany(foundCompany);
    
    const allTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
    const companyTickets = allTickets.filter(t => t.companyId === foundCompany.id);
    setTickets(companyTickets);

    const allDepartments = JSON.parse(localStorage.getItem('queueSystem_departments')) || [];
    const companyDepartments = allDepartments.filter(d => d.companyId === foundCompany.id);
    setDepartments(companyDepartments);
    
    const allUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    const companyUsers = allUsers.filter(u => u.companyId === foundCompany.id);
    setUsers(companyUsers);
    
    const storedSettings = JSON.parse(localStorage.getItem('aweyt_system_settings')) || {};
    setSystemSettings(storedSettings);

    setViewReady(true);
  }, [companySlug]);

  useEffect(() => {
    const interval = setInterval(() => {
      const allTickets = JSON.parse(localStorage.getItem('queueSystem_tickets')) || [];
      if (company) {
        const companyTickets = allTickets.filter(t => t.companyId === company.id);
        setTickets(companyTickets);

        const mostRecentCalled = companyTickets
          .filter(t => t.status === 'called' || t.status === 'serving')
          .sort((a, b) => new Date(b.calledAt || b.servedAt) - new Date(a.calledAt || a.servedAt))[0];
        
        if (mostRecentCalled && (!lastCalledTicket || mostRecentCalled.id !== lastCalledTicket.id)) {
          setLastCalledTicket(mostRecentCalled);
          const department = departments.find(d => d.id === mostRecentCalled.departmentId);
          
          const formattedNumber = mostRecentCalled.number.split('').join(', ');
          const announcement = `Turno ${formattedNumber}, puesto ${department?.name || ''}`;
          
          setTimeout(() => speak(announcement), 500);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [company, lastCalledTicket, departments, users, speak]);

  useEffect(() => {
    const images = company?.screenConfig?.images || [];
    if (images.length > 1) {
      const imageInterval = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
      }, 5000);
      return () => clearInterval(imageInterval);
    }
  }, [company?.screenConfig?.images]);

  const calledTickets = useMemo(() => {
    return tickets
      .filter(t => ['called', 'serving'].includes(t.status))
      .sort((a, b) => new Date(b.calledAt || b.servedAt) - new Date(a.calledAt || a.servedAt))
      .slice(0, 5);
  }, [tickets]);
  
  const waitingTickets = useMemo(() => {
    return tickets
      .filter(t => t.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 10);
  }, [tickets]);

  const getDepartmentName = (id) => departments.find(d => d.id === id)?.name;

  const embedUrl = useMemo(() => getEmbedUrl(company?.screenConfig?.videoUrl || ''), [company]);
  const images = useMemo(() => company?.screenConfig?.images || [], [company]);
  const hasMultimedia = (!!embedUrl && typeof embedUrl === 'string' && embedUrl.length > 10) || images.length > 0;
  
  const footerStyle = {
      fontFamily: systemSettings.footerFont || 'Inter, sans-serif',
      color: systemSettings.footerColor || '#64748b'
  };

  // Debug: mostrar la URL original y la generada para el iframe
  console.log("VIDEO URL:", company?.screenConfig?.videoUrl || '', "EMBED:", embedUrl);

  if (!viewReady) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Cargando...</div>;
  }

  if (!company) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-100 text-slate-700">
            <h1 className="text-4xl font-bold">Empresa no encontrada</h1>
            <p className="mt-4">El enlace que has seguido no es válido.</p>
            <Button onClick={() => navigate('/login')} className="mt-6">Volver al Inicio</Button>
        </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pantalla de Turnos - {company.name}</title>
        <meta name="description" content={`Pantalla pública de turnos para ${company.name}.`} />
        {systemSettings.footerFont && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${systemSettings.footerFont.replace(' ', '+')}:wght@400;700&display=swap`} />}
      </Helmet>
      <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden relative">
        <Button
            onClick={toggleMute}
            variant={isMuted ? 'destructive' : 'outline'}
            size="icon"
            className="absolute top-20 right-4 z-50 rounded-full"
        >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
        <header className="bg-blue-600 text-white p-3 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            {company.screenConfig?.logo && <img src={company.screenConfig.logo} alt="Logo" className="h-12 max-h-[50px] object-contain" />}
            <h1 className="text-4xl font-bold tracking-wider">{company.name}</h1>
          </div>
          <div className="text-right">
              <div className="text-5xl font-bold">{time}</div>
              <div className="text-lg capitalize">{date}</div>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
            <section className={`rounded-lg overflow-hidden relative shadow-lg ${hasMultimedia ? 'col-span-4' : 'hidden'}`}> 
              {(embedUrl && typeof embedUrl === 'string' && embedUrl.length > 10) ? (
                <>
                  {process.env.NODE_ENV === 'development' ? (
                    <div id="embed-fallback-msg" className="w-full h-full flex items-center justify-center bg-slate-100">
                      <div className="text-center text-slate-600">
                        <span style={{ fontSize: '3rem' }}>⚠️</span>
                        <p className="mt-2 mb-2">No se puede mostrar el video por políticas de seguridad del navegador (COEP/COOP).<br />Esto es normal en localhost, en producción funcionará correctamente.</p>
                        <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Ver video en nueva pestaña</a>
                      </div>
                    </div>
                  ) : (
                    <>
                      <iframe
                        className="w-full h-full"
                        src={embedUrl}
                        title="Video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onError={(e) => {
                          e.target.style.display = "none";
                          const fallback = document.getElementById("embed-fallback-msg");
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div id="embed-fallback-msg" style={{ display: "none" }} className="w-full h-full flex items-center justify-center bg-slate-100">
                        <div className="text-center text-slate-600">
                          <span style={{ fontSize: '3rem' }}>⚠️</span>
                          <p className="mt-2 mb-2">No se puede mostrar el video por políticas de seguridad del navegador (COEP/COOP).<br />Esto es normal en localhost, en producción funcionará correctamente.</p>
                          <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Ver video en nueva pestaña</a>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : images.length > 0 ? (
                <AnimatePresence>
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
                  />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  {/* Aquí podrías poner un mensaje o ícono de "sin video disponible" */}
                </div>
              )}
            </section>
            
            <section className={`${hasMultimedia ? 'col-span-8' : 'col-span-12'} grid grid-cols-2 gap-4`}>
                <div className="flex flex-col bg-slate-800 text-white rounded-lg shadow-lg">
                    <div className="p-3 bg-slate-900 rounded-t-lg">
                        <h2 className="text-xl font-bold uppercase text-center">Llamando</h2>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <AnimatePresence>
                        {calledTickets.map((ticket, index) => (
                            <motion.div
                            key={ticket.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            className={`grid grid-cols-2 text-center text-6xl font-black p-4 border-b border-slate-700 items-center
                                ${index === 0 ? 'bg-yellow-400 text-slate-900 animate-pulse-strong text-7xl' : ''}
                                ${index > 0 && index < 3 ? 'text-5xl' : ''}
                                ${index >= 3 ? 'text-4xl opacity-80' : ''}
                            `}
                            >
                            <span>{ticket.number}</span>
                            <span className="text-5xl">{getDepartmentName(ticket.departmentId) || 'N/A'}</span>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex flex-col bg-slate-100 text-slate-700 rounded-lg shadow-lg">
                    <div className="p-3 bg-slate-200 rounded-t-lg">
                        <h2 className="text-xl font-bold uppercase text-center">En Espera</h2>
                    </div>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <AnimatePresence>
                        {waitingTickets.map((ticket) => (
                            <motion.div
                            key={ticket.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            className="grid grid-cols-2 text-center text-4xl font-bold p-3 border-b border-slate-200 items-center"
                            >
                            <span className="text-blue-600">{ticket.number}</span>
                            <span className="text-2xl text-slate-500">{getDepartmentName(ticket.departmentId) || 'N/A'}</span>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </main>

        <footer className="p-2 text-center text-sm" style={footerStyle}>
          <div className="flex justify-center items-center gap-2">
            {systemSettings.footerLogo && <img src={systemSettings.footerLogo} alt="Branding" className="h-5 object-contain" />}
            <span>{systemSettings.footerText || 'Una solución de Aweyt'}</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PublicDisplayView;