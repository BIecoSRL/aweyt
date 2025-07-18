import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Image as ImageIcon, Banknote, User, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [settings, setSettings] = useState({ name: '', email: '', address: '', logo: '', bankAccounts: [] });
  const [adminUsers, setAdminUsers] = useState([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('turnosmart_system_settings')) || { bankAccounts: [] };
    setSettings(storedSettings);
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('turnosmart_users')) || [];
    setAdminUsers(allUsers.filter(u => u.role === 'superadmin'));
  };

  const handleSettingsChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
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
    localStorage.setItem('turnosmart_system_settings', JSON.stringify(settings));
    toast({ title: 'Ajustes Guardados', description: 'La configuración del sistema ha sido actualizada.' });
  };

  const handleSaveUser = (userData, userId) => {
    let allUsers = JSON.parse(localStorage.getItem('turnosmart_users')) || [];
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
    localStorage.setItem('turnosmart_users', JSON.stringify(allUsers));
    fetchAdminUsers();
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (adminUsers.length <= 1) {
      toast({ variant: 'destructive', title: 'Acción no permitida', description: 'No se puede eliminar al único super administrador.' });
      return;
    }
    let allUsers = JSON.parse(localStorage.getItem('turnosmart_users')) || [];
    allUsers = allUsers.filter(u => u.id !== userId);
    localStorage.setItem('turnosmart_users', JSON.stringify(allUsers));
    fetchAdminUsers();
    toast({ title: 'Administrador eliminado' });
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
            <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            {settings.logo && <img src={settings.logo} alt="Logo" className="h-16 mt-2 rounded-md border p-1"/>}
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

      <Button onClick={saveSettings} className="w-full">Guardar Todos los Ajustes</Button>

      <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Administrador</DialogTitle></DialogHeader>{editingUser && <AdminUserForm onSave={handleSaveUser} initialData={editingUser} isEdit={true} />}</DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SuperAdminSettings;