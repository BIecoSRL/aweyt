import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ADMIN_MODULES } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addMonths, addYears } from 'date-fns';

const LICENSE_STATUSES = ['nuevo', 'activo', 'inactivo', 'cancelado', 'renovado'];

const createUniqueSlug = (name, existingCompanies) => {
  if (!name) return '';
  
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const existingSlugs = new Set(existingCompanies.map(c => c.slug));
  
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;
  while (existingSlugs.has(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }
  
  return newSlug;
};

const LicenseForm = ({ onSave, initialData = {}, isEdit = false, allCompanies = [] }) => {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(initialData.name || '');
  const [rnc, setRnc] = useState(initialData.rnc || '');
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

  const generatedSlug = useMemo(() => {
    if (isEdit) return initialData.slug;
    return createUniqueSlug(companyName, allCompanies);
  }, [companyName, isEdit, initialData.slug, allCompanies]);

  const isSlugDuplicate = useMemo(() => {
    if (isEdit) return false;
    const tempSlug = companyName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    return allCompanies.some(c => c.slug === tempSlug);
  }, [companyName, allCompanies, isEdit]);

  const isRncDuplicate = useMemo(() => {
    if (!rnc) return false;
    return allCompanies.some(c => c.rnc === rnc && c.id !== initialData.id);
  }, [rnc, allCompanies, initialData.id]);

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

  useEffect(() => {
    if (email && !isEdit) {
      setAdminUsername(email.split('@')[0]);
    }
  }, [email, isEdit]);

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
    if (isRncDuplicate) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'El RNC introducido ya está en uso por otra empresa.',
      });
      return;
    }
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
      rnc,
      slug: generatedSlug,
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
        <div>
          <Label htmlFor="companyName">Nombre</Label>
          <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          {!isEdit && companyName && (
            isSlugDuplicate ? (
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />El slug base ya existe. Se generará uno único: <strong className="font-mono">{generatedSlug}</strong></p>
            ) : (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Slug disponible: <strong className="font-mono">{generatedSlug}</strong></p>
            )
          )}
        </div>
        <div>
          <Label htmlFor="rnc">RNC</Label>
          <Input id="rnc" value={rnc} onChange={e => setRnc(e.target.value)} />
           {rnc && (
            isRncDuplicate ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />Este RNC ya está en uso.</p>
            ) : (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" />RNC disponible.</p>
            )
          )}
        </div>
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div className="md:col-span-2"><Label htmlFor="address">Dirección</Label><Input id="address" value={address} onChange={e => setAddress(e.target.value)} /></div>
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

export default LicenseForm;