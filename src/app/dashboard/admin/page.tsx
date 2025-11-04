'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
// Users are now loaded from the server API
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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


const currentUserRole: UserRole = 'admin';
const currentUserId = 'user-001';

const roles: UserRole[] = ['admin', 'gestor', 'regional', 'visualizador', 'fornecedor'];

const modules = [
    { id: 'indicators', label: 'Painel de Indicadores' },
    { id: 'releases', label: 'Lançamentos Mensais' },
    { id: 'incidents', label: 'Registro de Incidentes' },
    { id: 'rncs', label: 'Registros de Não Conformidade' },
    { id: 'categories', label: 'Categorias de Itens' },
    { id: 'matrix', label: 'Matriz de Itens' },
    { id: 'compliance', label: 'Cronograma de Preventivas' },
    { id: 'suppliers', label: 'Gestão de Fornecedores' },
    { id: 'warranty', label: 'Controle de Garantias' },
    { id: 'tools', label: 'Almoxarifado de Ferramentas' },
    { id: 'settlement', label: 'Cartas de Quitação' },
    { id: 'profile', label: 'Meu Perfil' },
    { id: 'settings', label: 'Configurações' },
    { id: 'about', label: 'Sobre a Plataforma' },
];

const initialPermissions: Record<UserRole, Record<string, boolean>> = {
  admin: Object.fromEntries(modules.map(m => [m.id, true])),
  gestor: {
    'indicators': true, 'releases': true, 'incidents': true, 'rncs': true,
    'categories': true, 'matrix': true, 'compliance': true, 'suppliers': true,
    'warranty': true, 'tools': true, 'settlement': true, 'profile': true, 'settings': true, 'about': true,
  },
  regional: {
    'indicators': true, 'releases': false, 'incidents': true, 'rncs': true,
    'categories': false, 'matrix': true, 'compliance': true, 'suppliers': false,
    'warranty': true, 'tools': true, 'settlement': false, 'profile': true, 'settings': true, 'about': true,
  },
  visualizador: {
    'indicators': true, 'releases': false, 'incidents': false, 'rncs': false,
    'categories': false, 'matrix': false, 'compliance': false, 'suppliers': false,
    'warranty': false, 'tools': false, 'settlement': false, 'profile': true, 'settings': false, 'about': true,
  },
  fornecedor: {
    'indicators': false, 'releases': false, 'incidents': false, 'rncs': false,
    'categories': false, 'matrix': false, 'compliance': false, 'suppliers': false,
    'warranty': false, 'tools': false, 'settlement': true, 'profile': true, 'settings': true, 'about': true,
  },
};


export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState(initialPermissions);
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
      }
    };
    loadUsers();
  }, []);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole, supplierId: newRole === 'fornecedor' ? u.supplierId : undefined } : u)));
    toast({
      title: 'Perfil Atualizado!',
      description: `O perfil do usuário foi atualizado para ${newRole}.`,
    });
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
  };

  const handleAddUser = (data: UserFormData) => {
    const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        supplierId: data.role === 'fornecedor' ? data.supplierId : undefined,
        avatarUrl: `https://picsum.photos/seed/user${users.length + 1}/100/100`,
    };
    setUsers(prev => [newUser, ...prev]);
    setIsUserFormOpen(false);
    toast({
        title: "Usuário Criado!",
        description: `O usuário ${data.name} foi adicionado com sucesso.`
    });
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // In a real app, this would be an API call
    const newPassword = 'paguemenos';
    user.password = newPassword;
    toast({
      title: 'Senha Redefinida!',
      description: `A senha de ${user.name} foi redefinida para "${newPassword}".`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({
        variant: 'destructive',
        title: "Usuário Excluído!",
        description: `O usuário ${userToDelete.name} foi removido do sistema.`
    });
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Módulo</TableHead>
                {roles.map(role => (
                  <TableHead key={role} className="text-center capitalize">{role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map(module => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.label}</TableCell>
                  {roles.map(role => (
                    <TableCell key={role} className="text-center">
                      <Checkbox 
                        checked={permissions[role]?.[module.id] ?? false}
                        onCheckedChange={(checked) => handlePermissionChange(role, module.id, Boolean(checked))}
                        disabled={role === 'admin'}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <CardDescription>Adicione, edite ou altere os perfis dos usuários do sistema.</CardDescription>
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
        </CardHeader>
        <CardContent>
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
                                A senha do usuário <span className="font-bold">{user.name}</span> será redefinida para a senha padrão "paguemenos". O usuário será solicitado a alterá-la no próximo login.
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
        </CardContent>
      </Card>
    </div>
  );
}
