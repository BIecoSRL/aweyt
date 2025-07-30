import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Image as ImageIcon, Video, MessageSquare, Upload, Building, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ScreenConfigForm = ({ company, onSave }) => {
  const [config, setConfig] = useState(company.screenConfig || { logo: '', message: '', videoUrl: '', images: [] });
  const { toast } = useToast();

  const handleSave = () => {
    onSave(company.id, config);
    toast({
      title: 'Configuración Guardada',
      description: `La pantalla pública para ${company.name} ha sido actualizada.`,
    });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'images') {
          setConfig(prev => ({ ...prev, images: [...(prev.images || []), reader.result] }));
        } else {
          setConfig(prev => ({ ...prev, [field]: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    setConfig(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  return (
    <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label htmlFor="logo" className="flex items-center gap-2 mb-2">
          <ImageIcon className="h-5 w-5 text-slate-500" />
          Logo de la Empresa
        </Label>
        <Input id="logo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        {config.logo && <img src={config.logo} alt="Vista previa del logo" className="h-16 mt-2 rounded-md border p-1"/>}
      </div>

      <div>
        <Label htmlFor="message" className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-5 w-5 text-slate-500" />
          Mensaje de Bienvenida
        </Label>
        <Input id="message" name="message" value={config.message} onChange={handleChange} placeholder="Turnos de Atención"/>
      </div>

      <div>
        <Label htmlFor="videoUrl" className="flex items-center gap-2 mb-2">
          <Video className="h-5 w-5 text-slate-500" />
          URL de Video de YouTube (Opcional)
        </Label>
        <Input id="videoUrl" name="videoUrl" value={config.videoUrl} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..."/>
        <p className="text-xs text-slate-500 mt-1">Pega el enlace completo de un video de YouTube.</p>
      </div>
      
      <div>
        <Label htmlFor="images" className="flex items-center gap-2 mb-2">
          <Upload className="h-5 w-5 text-slate-500" />
          Subir Imágenes para el Carrusel
        </Label>
        <Input id="images" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'images')} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        <div className="flex gap-2 mt-2 flex-wrap">
          {(config.images || []).map((img, index) => (
            <div key={index} className="relative">
              <img src={img} alt={`Imagen ${index+1}`} className="h-20 rounded-md border p-1"/>
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => removeImage(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleSave} className="w-full mt-4">
        <Save className="h-4 w-4 mr-2" />
        Guardar Cambios
      </Button>
    </div>
  );
};

const ScreenConfig = () => {
  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    const storedCompanies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
    setCompanies(storedCompanies);
  }, []);

  const handleSaveConfig = (companyId, newConfig) => {
    const updatedCompanies = companies.map(c => {
      if (c.id === companyId) {
        return { ...c, screenConfig: newConfig };
      }
      return c;
    });
    localStorage.setItem('aweyt_companies', JSON.stringify(updatedCompanies));
    setCompanies(updatedCompanies);
    setEditingCompany(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Configuración de Pantallas Públicas</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="divide-y divide-slate-100">
          {companies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-lg">
                  {company.logo ? <img src={company.logo} alt="logo" className="h-8 w-8 rounded-full object-cover"/> : <Building className="h-6 w-6 text-slate-600" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{company.name}</p>
                  <p className="text-sm text-slate-500">{company.email}</p>
                </div>
              </div>
              <Dialog onOpenChange={(isOpen) => !isOpen && setEditingCompany(null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setEditingCompany(company)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </DialogTrigger>
                {editingCompany && editingCompany.id === company.id && (
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Configurar Pantalla para {company.name}</DialogTitle>
                    </DialogHeader>
                    <ScreenConfigForm company={company} onSave={handleSaveConfig} />
                  </DialogContent>
                )}
              </Dialog>
            </motion.div>
          ))}
          {companies.length === 0 && <p className="text-center p-8 text-slate-500">No hay empresas para configurar.</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default ScreenConfig;