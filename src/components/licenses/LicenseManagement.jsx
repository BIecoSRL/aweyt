import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, Calendar, ShieldCheck, Upload, DollarSign, BadgeInfo, Hash, Copy, Percent, AlertCircle, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ADMIN_MODULES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addMonths, addYears } from 'date-fns';

const LICENSE_STATUSES = ['nuevo', 'activo', 'inactivo', 'cancelado', 'renovado'];

const createSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const LicenseForm = ({ onSave, initialData = {}, isEdit = false }) => {
  const [companyName, setCompanyName] = useState(initialData.name || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [logo, setLogo] = useState(initialData.logo || '');
  const [licenseStartDate, setLicenseStartDate] = useState(initialData.licenseStartDate || new Date().toISOString().split('T')[0]);
  const [paymentFrequency, setPaymentFrequency] = useState(initialData.paymentFrequency || 'monthly');
  const [baseCost, setBaseCost] = useState(initialData.baseCost || '0');
  const [discount, setDiscount] = useState(initialData.discount || '0');
  const [totalCost, setTotalCost] = useState(initialData.totalCost || 0);
  const [installments, setInstallments] = useState(initialData.installments || 1);
  const [installmentAmount, setInstallmentAmount] = useState(initialData.installmentAmount || 0);
  const [currency, setCurrency] = useState(initialData.currency || 'USD');
  const [status, setStatus] = useState(initialData.status || 'nuevo');
  const [expiryAlertDays, setExpiryAlertDays] = useState(initialData.expiryAlertDays || 30);
  const [allowedModules, setAllowedModules] = useState(initialData.allowedModules || []);
  const [adminUsername, setAdminUsername] = useState(initialData.adminUsername || '');
  const [adminPassword, setAdminPassword] = useState('');
  const logoInputRef = useRef(null);

  useEffect(() => {
    const cost = parseFloat(baseCost) || 0;
    const disc = parseFloat(discount) || 0;
    const finalCost = cost - (cost * disc / 100);
    setTotalCost(finalCost);
  }, [baseCost, discount]);

  useEffect(() => {
    const numInstallments = parseInt(installments, 10) || 1;
    if (totalCost > 0 && numInstallments > 0) {
      setInstallmentAmount(totalCost / numInstallments);
    } else {
      setInstallmentAmount(0);
    }
  }, [totalCost, installments]);

  const handleModuleChange = (moduleId) => {
    setAllowedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = () => {
    const numInstallments = parseInt(installments, 10) || 1;
    const startDate = new Date(licenseStartDate);
    const finalExpiryDate = paymentFrequency === 'monthly' 
      ? addMonths(startDate, numInstallments) 
      : addYears(startDate, numInstallments);

    const payments = Array.from({ length: numInstallments }).map((_, i) => {
      const dueDate = paymentFrequency === 'monthly' ? addMonths(startDate, i) : addYears(startDate, i);
      return {
        id: Date.now() + i,
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending'
      };
    });

    const companyData = {
      name: companyName,
      slug: initialData.slug || createSlug(companyName),
      address,
      phone,
      email,
      logo,
      licenseStartDate,
      licenseExpiry: finalExpiryDate.toISOString().split('T')[0],
      paymentFrequency,
      baseCost: parseFloat(baseCost),
      discount: parseFloat(discount),
      totalCost: parseFloat(totalCost),
      installments: numInstallments,
      installmentAmount,
      currency,
      status,
      expiryAlertDays: parseInt(expiryAlertDays, 10),
      allowedModules,
      adminUsername,
      adminPassword: adminPassword,
      payments,
    };
    onSave(companyData, isEdit ? initialData.id : null, initialData.adminUsername);
  };

  return (
    <div className="py-4 space-y-4 max-h-[80vh] overflow-y-auto pr-4">
      <h3 className="text-lg font-semibold border-b pb-2">Información de la Empresa</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor="companyName">Nombre</Label><Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div><Label htmlFor="address">Dirección</Label><Input id="address" value={address} onChange={e => setAddress(e.target.value)} /></div>
        <div className="md:col-span-2">
          <Label htmlFor="logo-upload">Logo</Label>
          <Input id="logo-upload" type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          {logo && <img src={logo} alt="Vista previa del logo" className="h-16 mt-2 rounded-md border p-1"/>}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold border-b pb-2 pt-4">Detalles de Licencia</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div><Label htmlFor="licenseStartDate">Fecha de Inicio</Label><Input id="licenseStartDate" type="date" value={licenseStartDate} onChange={e => setLicenseStartDate(e.target.value)} /></div>
        <div>
          <Label>Frecuencia de Pago</Label>
          <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="annually">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="installments">Cantidad de Cuotas</Label><Input id="installments" type="number" value={installments} onChange={e => setInstallments(e.target.value)} min="1" /></div>
        <div><Label htmlFor="baseCost">Costo Base</Label><Input id="baseCost" type="number" value={baseCost} onChange={e => setBaseCost(e.target.value)} /></div>
        <div><Label htmlFor="discount">Descuento (%)</Label><Input id="discount" type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
        <div className="p-3 bg-blue-50 rounded-md text-center">
          <Label>Costo Total Final</Label>
          <p className="text-2xl font-bold text-blue-600">{totalCost.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-md text-center">
          <Label>Monto por Cuota</Label>
          <p className="text-2xl font-bold text-green-600">{installmentAmount.toFixed(2)}</p>
        </div>
        <div>
          <Label>Moneda</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="DOP">DOP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="expiryAlertDays">Alerta Vencimiento (días antes)</Label><Input id="expiryAlertDays" type="number" value={expiryAlertDays} onChange={e => setExpiryAlertDays(e.target.value)} /></div>
      </div>
      <div className="mt-4">
          <Label>Estado de la Licencia</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LICENSE_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
      </div>
      
      <div>
        <Label>Módulos Permitidos</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-md border border-slate-200 mt-1">
          {ADMIN_MODULES.map(module => (
            <div key={module.id} className="flex items-center space-x-2">
              <Checkbox id={`module-${module.id}`} checked={allowedModules.includes(module.id)} onCheckedChange={() => handleModuleChange(module.id)} />
              <label htmlFor={`module-${module.id}`} className="text-sm font-medium">{module.name}</label>
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-semibold border-b pb-2 pt-4">Administrador de la Empresa</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label htmlFor="adminUsername">Usuario Admin</Label><Input id="adminUsername" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} /></div>
          <div><Label htmlFor="adminPassword">Clave Admin</Label><Input id="adminPassword" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder={isEdit ? "Dejar en blanco para no cambiar" : ""} /></div>
      </div>

      <Button onClick={handleSubmit} className="w-full mt-4">{isEdit ? 'Guardar Cambios' : 'Crear Licencia y Empresa'}</Button>
    </div>
  );
};

const LicenseManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const { toast } = useToast();

  const fetchCompanies = () => {
    const storedCompanies = JSON.parse(localStorage.getItem('turnosmart_companies')) || [];
    setCompanies(storedCompanies);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSaveCompany = (companyData, companyId, oldAdminUsername) => {
    let storedCompanies = JSON.parse(localStorage.getItem('turnosmart_companies')) || [];
    let storedUsers = JSON.parse(localStorage.getItem('turnosmart_users')) || [];

    if (companyId) { // Update
      storedCompanies = storedCompanies.map(c => c.id === companyId ? { ...c, ...companyData, cost: companyData.totalCost, slug: c.slug || createSlug(c.name) } : c);
      
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
      const newCompany = { id: newCompanyId, ...companyData, cost: companyData.totalCost, slug: createSlug(companyData.name) };
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
    
    localStorage.setItem('turnosmart_companies', JSON.stringify(storedCompanies));
    localStorage.setItem('turnosmart_users', JSON.stringify(storedUsers));
    fetchCompanies();
    setIsDialogOpen(false);
    setEditingCompany(null);
  };
  
  const handleDeleteCompany = (companyId) => {
      let storedCompanies = companies.filter(c => c.id !== companyId);
      let storedUsers = (JSON.parse(localStorage.getItem('turnosmart_users')) || []).filter(u => u.companyId !== companyId);

      localStorage.setItem('turnosmart_companies', JSON.stringify(storedCompanies));
      localStorage.setItem('turnosmart_users', JSON.stringify(storedUsers));

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
            <LicenseForm onSave={handleSaveCompany} />
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
                  <p className="text-sm text-slate-500">{company.email}</p>
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
            {editingCompany && <LicenseForm onSave={handleSaveCompany} initialData={editingCompany} isEdit={true} />}
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default LicenseManagement;