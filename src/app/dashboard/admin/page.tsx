'use client';
import { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, UserRole, Supplier } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, PlusCircle, MoreHorizontal, KeyRound, UserPlus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserForm, UserFormData } from '@/components/dashboard/admin/user-form';
import { PermissionsMatrix } from '@/components/dashboard/admin/permissions-matrix';
import { cloneDefaultPermissions, moduleDefinitions, roleList } from '@/lib/permissions-config';


const currentUserRole: UserRole = 'admin';
const currentUserId = 'user-001';

const roles: UserRole[] = roleList;


export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState(() => cloneDefaultPermissions());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { toast } = useToast();
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await fetch('/api/suppliers');
        const data = await res.json();
        setSuppliers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load suppliers', e);
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar fornecedores.' });
      }
    };
    loadSuppliers();
    // load users from API
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load users', e);
        // fallback to empty array
        setUsers([]);
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar usuários.' });
      }
    };
    loadUsers();
    // load persisted permissions
    const loadPermissions = async () => {
      try {
        const res = await fetch('/api/permissions');
        if (res.ok) {
          const json = await res.json();
          const serverPerms = (json && json.permissions) || {};
          const merged = cloneDefaultPermissions();
          (Object.keys(serverPerms) as UserRole[]).forEach(role => {
            if (!merged[role]) merged[role] = {};
            Object.keys(serverPerms[role]).forEach(moduleId => {
              merged[role][moduleId] = Boolean(serverPerms[role][moduleId]);
            });
          });
          setPermissions(merged);
        }
      } catch (e) {
        console.error('Failed to load permissions', e);
      }
    };
    loadPermissions();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole, supplierId: newRole === 'fornecedor' ? u.supplierId : undefined } : u)));
    try {
      await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, role: newRole }) });
    } catch (e) {
      console.error('update role failed', e);
    }
    toast({ title: 'Perfil Atualizado!', description: `O perfil do usuário foi atualizado para ${newRole}.` });
  };

  const handlePermissionChange = (role: UserRole, moduleId: string, checked: boolean) => {
    if (role === 'admin') return;

    setPermissions(prev => ({
        ...prev,
        [role]: {
            ...prev[role],
            [moduleId]: checked
        }
    }));

    toast({
      title: 'Permissão Alterada!',
      description: `O acesso do perfil ${role} ao módulo foi ${checked ? 'concedido' : 'revogado'}.`,
    });
    // persist to API (fire-and-forget)
    (async () => {
      try {
        await fetch('/api/permissions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, moduleId, allowed: Boolean(checked) }) });
      } catch (e) {
        console.error('Failed to persist permission', e);
      }
    })();
  };

  const handleAddUser = async (data: UserFormData) => {
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        supplierId: data.role === 'fornecedor' ? data.supplierId : undefined,
        avatarUrl: `https://picsum.photos/seed/user${users.length + 1}/100/100`,
      })});
      if (!res.ok) throw new Error('create failed');
      const created: User = await res.json();
      setUsers(prev => [created, ...prev]);
      setIsUserFormOpen(false);
      toast({ title: 'Usuário Criado!', description: `O usuário ${data.name} foi adicionado com sucesso.` });
    } catch (e) {
      console.error('create user failed', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar o usuário.' });
    }
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newPassword = 'paguemenos';
    try {
      await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, password: newPassword }) });
      toast({ title: 'Senha Redefinida!', description: `A senha de ${user.name} foi redefinida para "${newPassword}".` });
    } catch (e) {
      console.error('reset password failed', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível redefinir a senha.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(String(userId))}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ variant: 'destructive', title: 'Usuário Excluído!', description: `O usuário ${userToDelete.name} foi removido do sistema.` });
    } catch (e) {
      console.error('delete user failed', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o usuário.' });
    }
  };

  if (currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Acesso Negado"
          description="Você não tem permissão para acessar esta página."
        />
        <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
                Apenas administradores podem visualizar o conteúdo da página de administração.
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Administração"
        description="Gerencie usuários, perfis e permissões do sistema."
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Perfis de Acesso</CardTitle>
          <CardDescription>Defina quais módulos cada perfil de usuário pode acessar.</CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionsMatrix
            permissions={permissions}
            roles={roles}
            modules={moduleDefinitions}
            onToggle={handlePermissionChange}
            disabledRoles={['admin']}
          />
          <div className="mt-6">
            <Separator />
            <div className="mt-4 flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Gerenciamento de Usuários</CardTitle>
                    <p className="text-sm text-muted-foreground">Adicione, edite ou altere os perfis dos usuários do sistema.</p>
                </div>
                 <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2" />
                            Adicionar Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Usuário</DialogTitle>
                        </DialogHeader>
                        <UserForm 
                            roles={roles.filter(r => r !== 'admin')}
                            suppliers={suppliers}
                            onSubmit={handleAddUser}
                            onCancel={() => setIsUserFormOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[150px]">Perfil</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar"/>}
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as UserRole)} disabled={user.role === 'admin'}>
                          <SelectTrigger className="ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                                 <SelectItem key={role} value={role} className="capitalize" disabled={role === 'admin'}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                       <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={user.id === currentUserId}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                    <KeyRound className="mr-2" /> Redefinir Senha
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Redefinir Senha?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    A senha do usuário <span className='font-bold'>{user.name}</span> será redefinida para a senha padrão paguemenos. O usuário será solicitado a alterá-la no próximo login.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResetPassword(user.id)}>
                                    Redefinir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2" /> Excluir Usuário
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário <span className="font-bold">{user.name}</span> do sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
