
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Banknote, User, Plus, Edit, Trash2, Shield, Download, Brush, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPER_ADMIN_MODULES } from '@/lib/constants';
import bcrypt from 'bcryptjs';

const AdminUserForm = ({ onSave, initialData = {}, isEdit = false }) => {
  const [username, setUsername] = useState(initialData.username || '');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState(initialData.permissions || []);

  const handlePermissionChange = (moduleId) => {
    setPermissions(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSubmit = () => {
    const userData = { username, permissions };
    if (password) {
      userData.password = password;
    }
    onSave(userData, isEdit ? initialData.id : null);
  };

  return (
    <div className="py-4 space-y-4">
      <div><Label htmlFor="username">Usuario</Label><Input id="username" value={username} onChange={e => setUsername(e.target.value)} disabled={isEdit} /></div>
      <div><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isEdit ? "Dejar en blanco para no cambiar" : ""} /></div>
      <div>
        <Label>Permisos de Módulos</Label>
        <div className="grid grid-cols-2 gap-2 p-3 rounded-md border border-slate-200 mt-1">
          {SUPER_ADMIN_MODULES.map(module => (
            <div key={module.id} className="flex items-center space-x-2">
              <Checkbox id={`perm-${module.id}`} checked={permissions.includes(module.id)} onCheckedChange={() => handlePermissionChange(module.id)} />
              <label htmlFor={`perm-${module.id}`} className="text-sm font-medium">{module.name}</label>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full mt-4">{isEdit ? 'Guardar Cambios' : 'Crear Administrador'}</Button>
    </div>
  );
};

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState({ 
    name: '', 
    email: '', 
    address: '', 
    logo: '', 
    bankAccounts: [],
    footerText: 'Una solución del Grupo Bieco',
    footerFont: 'Inter',
    footerColor: '#64748b',
    footerLogo: ''
  });
  const [adminUsers, setAdminUsers] = useState([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('aweyt_system_settings')) || { 
        bankAccounts: [],
        footerText: 'Una solución del Grupo Bieco',
        footerFont: 'Inter',
        footerColor: '#64748b',
        footerLogo: ''
    };
    setSettings(storedSettings);
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    setAdminUsers(allUsers.filter(u => u.role === 'superadmin'));
  };

  const handleSettingsChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (name, value) => {
    setSettings({ ...settings, [name]: value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, [fieldName]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (fieldName) => {
    setSettings({ ...settings, [fieldName]: '' });
    toast({ title: 'Imagen eliminada', description: 'La imagen ha sido eliminada. Guarda los cambios para confirmar.' });
  };

  const handleBankAccountChange = (index, e) => {
    const newBankAccounts = [...settings.bankAccounts];
    newBankAccounts[index][e.target.name] = e.target.value;
    setSettings({ ...settings, bankAccounts: newBankAccounts });
  };

  const addBankAccount = () => {
    setSettings({ ...settings, bankAccounts: [...settings.bankAccounts, { bankName: '', accountNumber: '', accountType: '' }] });
  };

  const removeBankAccount = (index) => {
    const newBankAccounts = settings.bankAccounts.filter((_, i) => i !== index);
    setSettings({ ...settings, bankAccounts: newBankAccounts });
  };

  const saveSettings = () => {
    localStorage.setItem('aweyt_system_settings', JSON.stringify(settings));
    toast({ title: 'Ajustes Guardados', description: 'La configuración del sistema ha sido actualizada.' });
  };

  const handleSaveUser = (userData, userId) => {
    let allUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    if (userId) { // Update
      allUsers = allUsers.map(u => {
        if (u.id === userId) {
          const updatedUser = { ...u, ...userData };
          if (userData.password) {
            updatedUser.passwordHash = bcrypt.hashSync(userData.password, 10);
          }
          delete updatedUser.password;
          return updatedUser;
        }
        return u;
      });
      toast({ title: 'Administrador actualizado' });
    } else { // Create
      const newUser = {
        id: Date.now(),
        ...userData,
        passwordHash: bcrypt.hashSync(userData.password, 10),
        role: 'superadmin',
        activo: true,
        companyId: 'super',
      };
      delete newUser.password;
      allUsers.push(newUser);
      toast({ title: 'Administrador creado' });
    }
    localStorage.setItem('aweyt_users', JSON.stringify(allUsers));
    fetchAdminUsers();
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (adminUsers.length <= 1) {
      toast({ variant: 'destructive', title: 'Acción no permitida', description: 'No se puede eliminar al único super administrador.' });
      return;
    }
    let allUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    allUsers = allUsers.filter(u => u.id !== userId);
    localStorage.setItem('aweyt_users', JSON.stringify(allUsers));
    fetchAdminUsers();
    toast({ title: 'Administrador eliminado' });
  };

  const exportAllData = () => {
    try {
      const dataToExport = {
        systemSettings: JSON.parse(localStorage.getItem('aweyt_system_settings') || '{}'),
        companies: JSON.parse(localStorage.getItem('aweyt_companies') || '[]'),
        users: JSON.parse(localStorage.getItem('aweyt_users') || '[]'),
        departments: JSON.parse(localStorage.getItem('queueSystem_departments') || '[]'),
        services: JSON.parse(localStorage.getItem('queueSystem_services') || '[]'),
        tickets: JSON.parse(localStorage.getItem('queueSystem_tickets') || '[]'),
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "aweyt-backup.json";
      link.click();
      toast({ title: 'Exportación Exitosa', description: 'Todos los datos han sido descargados.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error de Exportación', description: 'No se pudieron exportar los datos.' });
      console.error("Export error:", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-800">Ajustes del Sistema</h2>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xl font-semibold flex items-center gap-2"><Settings className="h-5 w-5" />Ajustes Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label htmlFor="name">Nombre del Sistema</Label><Input id="name" name="name" value={settings.name} onChange={handleSettingsChange} /></div>
          <div><Label htmlFor="email">Email de Contacto</Label><Input id="email" name="email" type="email" value={settings.email} onChange={handleSettingsChange} /></div>
          <div className="md:col-span-2"><Label htmlFor="address">Dirección</Label><Input id="address" name="address" value={settings.address} onChange={handleSettingsChange} /></div>
          <div className="md:col-span-2">
            <Label htmlFor="logo">Logo del Sistema</Label>
            <div className="flex items-center gap-4">
              <Input id="logo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            {settings.logo && (
              <div className="mt-2 flex items-center gap-2">
                <img src={settings.logo} alt="Logo" className="h-16 rounded-md border p-1"/>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeImage('logo')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xl font-semibold flex items-center gap-2"><Brush className="h-5 w-5" />Branding de Portada</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="footerText">Texto de la firma</Label>
            <Input id="footerText" name="footerText" value={settings.footerText} onChange={handleSettingsChange} />
          </div>
          <div>
            <Label htmlFor="footerFont">Tipo de letra</Label>
            <Select name="footerFont" value={settings.footerFont} onValueChange={(value) => handleSelectChange('footerFont', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="footerColor">Color del texto</Label>
            <Input id="footerColor" name="footerColor" type="color" value={settings.footerColor} onChange={handleSettingsChange} className="p-1 h-10"/>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="footerLogo">Logo de la firma</Label>
            <Input id="footerLogo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'footerLogo')} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            {settings.footerLogo && (
              <div className="mt-2 flex items-center gap-2">
                <img src={settings.footerLogo} alt="Logo de la firma" className="h-10 rounded-md border p-1 bg-slate-100"/>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeImage('footerLogo')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2"><Banknote className="h-5 w-5" />Cuentas Bancarias</h3>
        {settings.bankAccounts.map((acc, index) => (
          <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div><Label>Banco</Label><Input name="bankName" value={acc.bankName} onChange={(e) => handleBankAccountChange(index, e)} /></div>
              <div><Label>No. de Cuenta</Label><Input name="accountNumber" value={acc.accountNumber} onChange={(e) => handleBankAccountChange(index, e)} /></div>
              <div><Label>Tipo de Cuenta</Label><Input name="accountType" value={acc.accountType} onChange={(e) => handleBankAccountChange(index, e)} /></div>
            </div>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeBankAccount(index)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={addBankAccount}><Plus className="h-4 w-4 mr-2" />Añadir Cuenta</Button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold flex items-center gap-2"><Shield className="h-5 w-5" />Administradores del Sistema</h3>
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild><Button onClick={() => setEditingUser(null)}><Plus className="h-4 w-4 mr-2" />Nuevo Admin</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Crear Administrador</DialogTitle></DialogHeader><AdminUserForm onSave={handleSaveUser} /></DialogContent>
          </Dialog>
        </div>
        {adminUsers.map(user => (
          <div key={user.id} className="flex justify-between items-center p-2 border rounded-md">
            <p>{user.username}</p>
            <div>
              <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsUserDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2"><Download className="h-5 w-5" />Exportar Datos</h3>
        <p className="text-sm text-slate-500">Descarga una copia de seguridad de todos los datos del sistema en formato JSON.</p>
        <Button onClick={exportAllData} variant="secondary">Exportar Todos los Datos</Button>
      </div>

      <Button onClick={saveSettings} className="w-full">Guardar Todos los Ajustes</Button>

      <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Administrador</DialogTitle></DialogHeader>{editingUser && <AdminUserForm onSave={handleSaveUser} initialData={editingUser} isEdit={true} />}</DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SuperAdminSettings;
