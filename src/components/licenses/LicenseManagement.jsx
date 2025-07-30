import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, Calendar, DollarSign, Copy, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import bcrypt from 'bcryptjs';
import LicenseForm from '@/components/licenses/LicenseForm';

const LicenseManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const { toast } = useToast();

  const fetchCompanies = () => {
    const storedCompanies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
    setCompanies(storedCompanies);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSaveCompany = (companyData, companyId, oldAdminUsername) => {
    let storedCompanies = JSON.parse(localStorage.getItem('aweyt_companies')) || [];
    let storedUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];

    const rncExists = storedCompanies.some(c => c.rnc === companyData.rnc && c.id !== companyId);
    if (rncExists) {
        toast({
            variant: 'destructive',
            title: 'RNC Duplicado',
            description: 'El RNC que intentas guardar ya está registrado para otra empresa.',
        });
        return;
    }

    if (companyId) { // Update
      storedCompanies = storedCompanies.map(c => c.id === companyId ? { ...c, ...companyData, cost: companyData.totalCost } : c);
      
      const companyAdmin = storedUsers.find(u => u.companyId === companyId && u.username === oldAdminUsername && u.role === 'admin');
      if (companyAdmin) {
        companyAdmin.username = companyData.adminUsername;
        if (companyData.adminPassword) {
          companyAdmin.passwordHash = bcrypt.hashSync(companyData.adminPassword, 10);
        }
        storedUsers = storedUsers.map(u => u.id === companyAdmin.id ? companyAdmin : u);
      }
       toast({ title: 'Empresa actualizada' });
    } else { // Create
      const newCompanyId = Date.now();
      const newCompany = { id: newCompanyId, ...companyData, cost: companyData.totalCost };
      storedCompanies.push(newCompany);

      const salt = bcrypt.genSaltSync(10);
      const newAdminUser = {
        id: Date.now() + 1,
        username: companyData.adminUsername,
        passwordHash: bcrypt.hashSync(companyData.adminPassword, salt),
        role: 'admin',
        activo: true,
        permissions: ['dashboard', ...companyData.allowedModules],
        companyId: newCompanyId,
      };
      storedUsers.push(newAdminUser);

      toast({ title: 'Empresa y administrador creados' });
    }
    
    localStorage.setItem('aweyt_companies', JSON.stringify(storedCompanies));
    localStorage.setItem('aweyt_users', JSON.stringify(storedUsers));
    fetchCompanies();
    setIsDialogOpen(false);
    setEditingCompany(null);
  };
  
  const handleDeleteCompany = (companyId) => {
      let storedCompanies = companies.filter(c => c.id !== companyId);
      let storedUsers = (JSON.parse(localStorage.getItem('aweyt_users')) || []).filter(u => u.companyId !== companyId);

      localStorage.setItem('aweyt_companies', JSON.stringify(storedCompanies));
      localStorage.setItem('aweyt_users', JSON.stringify(storedUsers));

      setCompanies(storedCompanies);
      toast({ title: 'Empresa eliminada', description: 'La empresa y sus usuarios han sido eliminados.' });
  };
  
  const copyLink = (type, slug) => {
    const url = `${window.location.origin}/${type}/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Enlace Copiado', description: `El enlace de ${type === 'customer' ? 'cliente' : 'pantalla pública'} ha sido copiado.` });
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Licencias</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCompany(null)}><Plus className="h-4 w-4 mr-2" />Nueva Licencia</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Crear Nueva Licencia de Empresa</DialogTitle></DialogHeader>
            <LicenseForm onSave={handleSaveCompany} allCompanies={companies} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="divide-y divide-slate-100">
          {companies.map((company, index) => (
            <motion.div key={company.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-lg">
                  {company.logo ? <img src={company.logo} alt="logo" className="h-8 w-8 rounded-full object-cover"/> : <Building className="h-6 w-6 text-slate-600" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{company.name}</p>
                  <p className="text-sm text-slate-500">RNC: {company.rnc || 'N/A'}</p>
                   <div className="flex gap-2 mt-1">
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => copyLink('customer', company.slug)}>
                            Copiar enlace de cliente <Copy className="h-3 w-3 ml-1" />
                        </Button>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-purple-600" onClick={() => copyLink('public', company.slug)}>
                            Copiar enlace de pantalla <MonitorPlay className="h-3 w-3 ml-1" />
                        </Button>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="flex items-center gap-1.5 text-sm text-slate-600"><Calendar className="h-4 w-4" /> Expira: {new Date(company.licenseExpiry).toLocaleDateString()}</p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-600"><DollarSign className="h-4 w-4" /> {company.totalCost?.toFixed(2) || company.cost} {company.currency}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setEditingCompany(company); setIsDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteCompany(company.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          ))}
           {companies.length === 0 && <p className="text-center p-8 text-slate-500">No hay empresas licenciadas.</p>}
        </div>
      </div>
      
       <Dialog open={!!editingCompany} onOpenChange={(isOpen) => { if (!isOpen) setEditingCompany(null); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Editar Licencia de Empresa</DialogTitle></DialogHeader>
            {editingCompany && <LicenseForm onSave={handleSaveCompany} initialData={editingCompany} isEdit={true} allCompanies={companies} />}
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default LicenseManagement;