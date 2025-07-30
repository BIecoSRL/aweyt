
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ADMIN_MODULES } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import bcrypt from 'bcryptjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MultiSelectDepartments = ({ departments, selectedIds, onSelectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (departmentId) => {
    const newSelectedIds = selectedIds.includes(departmentId)
      ? selectedIds.filter(id => id !== departmentId)
      : [...selectedIds, departmentId];
    onSelectionChange(newSelectedIds);
  };

  const selectedDepartmentNames = departments
    .filter(d => selectedIds.includes(d.id))
    .map(d => d.name)
    .join(', ');

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedDepartmentNames || "Seleccionar departamentos..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="p-2 space-y-1">
          {departments.map((department) => (
            <div
              key={department.id}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer"
              onClick={() => handleSelect(department.id)}
            >
              <Checkbox
                id={`dept-${department.id}`}
                checked={selectedIds.includes(department.id)}
                onCheckedChange={() => handleSelect(department.id)}
              />
              <label
                htmlFor={`dept-${department.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full"
              >
                {department.name}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const UserForm = ({ onSave, initialData = {}, departments, currentUser, isEdit = false }) => {
  const [username, setUsername] = useState(initialData.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialData.role || 'employee');
  const [departmentIds, setDepartmentIds] = useState(initialData.departmentIds || (initialData.department_id ? [initialData.department_id] : []));
  const [permissions, setPermissions] = useState(initialData.permissions || ['dashboard', 'tickets', 'history']);
  const [photo, setPhoto] = useState(initialData.photo || '');
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (role === 'admin') {
      const companyAdminModules = ADMIN_MODULES.map(m => m.id);
      setPermissions(companyAdminModules);
      setDepartmentIds([]);
    } else {
        setPermissions(initialData.permissions || ['dashboard', 'tickets', 'history']);
    }
  }, [role, initialData.permissions]);

  const handlePermissionChange = (moduleId) => {
    setPermissions(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const userData = {
      username,
      role,
      departmentIds: role === 'employee' ? departmentIds : [],
      permissions,
      photo,
    };
    if (password) {
      userData.password = password;
    }
    onSave(userData, isEdit ? initialData.id : null);
  };

  return (
    <div className="py-4 space-y-4">
      <div>
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isEdit} />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "Dejar en blanco para no cambiar" : ""}/>
      </div>
      <div>
        <Label htmlFor="photo-upload">Foto de Perfil</Label>
        <Input id="photo-upload" type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        {photo && <Avatar className="mt-2 h-16 w-16"><AvatarImage src={photo} alt="Vista previa" /></Avatar>}
      </div>
      <div>
        <Label>Rol</Label>
        <Select value={role} onValueChange={setRole} disabled={isEdit && initialData.id === currentUser.id}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="employee">Empleado</SelectItem>
          </SelectContent>
        </Select>
        {isEdit && initialData.id === currentUser.id && <p className="text-xs text-yellow-600 mt-1">No puedes cambiar tu propio rol.</p>}
      </div>
      {role === 'employee' && (
        <>
          <div>
            <Label>Departamentos Asignados</Label>
            <MultiSelectDepartments
              departments={departments}
              selectedIds={departmentIds}
              onSelectionChange={setDepartmentIds}
            />
          </div>
          <div>
            <Label>Permisos de Módulos</Label>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-md border border-slate-200 mt-1">
              {ADMIN_MODULES.filter(m => m.roles.includes('employee')).map(module => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${module.id}`}
                    checked={permissions.includes(module.id)}
                    onCheckedChange={() => handlePermissionChange(module.id)}
                  />
                  <label htmlFor={`perm-${module.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {module.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <Button onClick={handleSubmit} className="w-full" disabled={!username || (!password && !isEdit) || (role === 'employee' && departmentIds.length === 0)}>
        {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
      </Button>
    </div>
  );
};


const UserManagement = ({ departments }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { toast } = useToast();

  const fetchUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    const companyUsers = storedUsers.filter(u => u.companyId === currentUser.companyId && u.role !== 'superadmin');
    setUsers(companyUsers);
  };

  useEffect(() => {
    if(currentUser?.companyId) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleSaveUser = (userData, userId) => {
    let storedUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    if (userId) { // Update
      storedUsers = storedUsers.map(u => {
        if (u.id === userId) {
          const updatedUser = { ...u, ...userData };
          if (userData.password) {
            updatedUser.passwordHash = bcrypt.hashSync(userData.password, 10);
          }
          delete updatedUser.password;
          // Clean up old single department id if it exists
          delete updatedUser.department_id;
          return updatedUser;
        }
        return u;
      });
      toast({ title: 'Usuario actualizado', description: 'Los datos se han guardado.' });
    } else { // Create
      const newUser = {
        id: Date.now(),
        ...userData,
        passwordHash: bcrypt.hashSync(userData.password, 10),
        activo: true,
        companyId: currentUser.companyId,
      };
      delete newUser.password;
      storedUsers.push(newUser);
      toast({ title: 'Usuario creado', description: `El usuario ${userData.username} ha sido creado.` });
    }
    localStorage.setItem('aweyt_users', JSON.stringify(storedUsers));
    fetchUsers();
    setIsNewUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    let storedUsers = JSON.parse(localStorage.getItem('aweyt_users')) || [];
    storedUsers = storedUsers.filter(u => u.id !== userId);
    localStorage.setItem('aweyt_users', JSON.stringify(storedUsers));
    toast({ title: 'Usuario eliminado' });
    fetchUsers();
  };

  const getDepartmentNames = (departmentIds) => {
    if (!departmentIds || departmentIds.length === 0) return 'Sin asignar';
    return departmentIds.map(id => departments.find(d => d.id === id)?.name || '').filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h2>
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Nuevo Usuario</DialogTitle></DialogHeader>
            <UserForm onSave={handleSaveUser} departments={departments} currentUser={currentUser} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Lista de Usuarios</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                 <Avatar>
                  <AvatarImage src={user.photo} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-700">{user.username}</p>
                  <p className="text-sm text-slate-500 truncate max-w-xs">
                    {user.role === 'admin' ? 'Administrador' : `Empleado - ${getDepartmentNames(user.departmentIds)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => setEditingUser(user)}>
                   <Edit className="h-4 w-4"/>
                 </Button>
                 {user.id !== currentUser.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario "{user.username}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
          {editingUser && <UserForm isEdit={true} onSave={handleSaveUser} initialData={editingUser} departments={departments} currentUser={currentUser} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
