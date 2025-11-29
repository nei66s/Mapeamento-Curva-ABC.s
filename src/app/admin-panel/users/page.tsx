'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import type { Permission, UserStatus } from '@/types/admin';
import type { UserRole } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Lock, Unlock, KeyRound, ShieldPlus, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  role: z.custom<UserRole>(),
  status: z.custom<UserStatus>().default('active'),
  password: z.string().min(6),
});

const roleSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  permissions: z.array(
    z.object({
      id: z.string(),
      module: z.string(),
      action: z.string(),
    })
  ),
});

const permissionsCatalog: Permission[] = [
  { id: 'users:manage', module: 'users', action: 'manage', description: 'Criar e editar usuários' },
  { id: 'roles:manage', module: 'roles', action: 'manage', description: 'Gerenciar perfis e RBAC' },
  { id: 'modules:manage', module: 'modules', action: 'manage', description: 'Habilitar/ocultar módulos' },
  { id: 'analytics:view', module: 'analytics', action: 'view', description: 'Consultar métricas' },
  { id: 'audit:view', module: 'audit', action: 'view', description: 'Ver trilhas de auditoria' },
  { id: 'config:edit', module: 'config', action: 'edit', description: 'Alterar configurações' },
  { id: 'health:view', module: 'health', action: 'view', description: 'Ver status das dependências' },
];

export default function UsersAdminPage() {
  const [filters, setFilters] = useState<{ email?: string; role?: UserRole; status?: UserStatus }>({});
  const users = useUsers({ ...filters, pageSize: 12 });
  const roles = useRoles();
  const { toast } = useToast();

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      status: 'active',
      role: 'usuario',
    },
  });

  const roleForm = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      permissions: [],
    },
  });

  const handleCreateUser = async (values: z.infer<typeof userSchema>) => {
    await users.create.mutateAsync({
      name: values.name,
      email: values.email,
      role: values.role,
      status: values.status,
      password: values.password,
    });
    userForm.reset({ status: 'active', role: 'usuario' });
    toast({ title: 'Usuário criado', description: 'O usuário foi cadastrado e auditado.' });
  };

  const handleCreateRole = async (values: z.infer<typeof roleSchema>) => {
    await roles.create.mutateAsync({
      name: values.name,
      description: values.description,
      permissions: values.permissions,
    });
    roleForm.reset({ permissions: [] });
    toast({ title: 'Papel criado', description: 'Permissões aplicadas imediatamente.' });
  };

  const togglePermission = (current: Permission[], permission: Permission) => {
    const exists = current.find((p) => p.id === permission.id);
    if (exists) return current.filter((p) => p.id !== permission.id);
    return [...current, permission];
  };

  const rolePermissionIds = useMemo(
    () => {
      const raw = Array.isArray(roles.list.data) ? roles.list.data : (roles.list.data && (roles.list.data as any).items) || [];
      return Object.fromEntries(raw.map((role: any) => [role.id, new Set((role.permissions || []).map((p: any) => p.id))]));
    },
    [roles.list.data]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários e Permissões"
        description="Cadastre usuários, bloqueie acessos e configure papéis RBAC."
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <ShieldPlus className="mr-2 h-4 w-4" /> Novo papel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar papel</DialogTitle>
              <DialogDescription>Defina permissões por módulo/ação.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={roleForm.handleSubmit(handleCreateRole)}
            >
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nome</label>
                <Input placeholder="Governança" {...roleForm.register('name')} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input placeholder="Escopo do papel" {...roleForm.register('description')} />
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-medium">Permissões</label>
                <div className="space-y-2">
                  {permissionsCatalog.map((perm) => (
                    <label key={perm.id} className="flex items-start gap-2 rounded-md border p-2">
                      <Checkbox
                        checked={roleForm.watch('permissions').some((p) => p.id === perm.id)}
                        onCheckedChange={() =>
                          roleForm.setValue('permissions', togglePermission(roleForm.getValues('permissions'), perm))
                        }
                      />
                      <div className="text-sm">
                        <div className="font-medium">{perm.id}</div>
                        <div className="text-muted-foreground">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={roles.create.isPending}>
                {roles.create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar papel
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Gestão de usuários</CardTitle>
            <CardDescription>Filtros por e-mail, status e papel.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Filtrar por e-mail"
              className="w-48"
              onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as UserStatus }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value as UserRole }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="gestor">gestor</SelectItem>
                <SelectItem value="regional">regional</SelectItem>
                <SelectItem value="visualizador">visualizador</SelectItem>
                <SelectItem value="usuario">usuario</SelectItem>
              </SelectContent>
            </Select>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Novo usuário</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar usuário</DialogTitle>
                  <DialogDescription>Crie, defina status e papéis.</DialogDescription>
                </DialogHeader>
                <form className="space-y-3" onSubmit={userForm.handleSubmit(handleCreateUser)}>
                  <Input placeholder="Nome completo" {...userForm.register('name')} />
                  <Input type="email" placeholder="email@empresa.com" {...userForm.register('email')} />
                  <Input type="password" placeholder="Senha inicial" {...userForm.register('password')} />
                  <Select onValueChange={(value) => userForm.setValue('role', value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="gestor">gestor</SelectItem>
                      <SelectItem value="regional">regional</SelectItem>
                      <SelectItem value="visualizador">visualizador</SelectItem>
                      <SelectItem value="usuario">usuario</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(value) => userForm.setValue('status', value as UserStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={users.create.isPending}>
                    {users.create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar usuário
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <AlertTitle>Política de bloqueio</AlertTitle>
            <AlertDescription>
              Bloquear usuários impede login e registra auditoria. Reset de senha envia payload à API simulada.
            </AlertDescription>
          </Alert>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users.data?.items || []).map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === 'blocked' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          users.toggleStatus.mutateAsync({
                            id: user.id,
                            status: user.status === 'blocked' ? 'active' : 'blocked',
                          })
                        }
                      >
                        {user.status === 'blocked' ? <Unlock className="mr-1 h-4 w-4" /> : <Lock className="mr-1 h-4 w-4" />}
                        {user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => users.resetPassword.mutateAsync(user.id)}
                      >
                        <KeyRound className="mr-1 h-4 w-4" />
                        Resetar senha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de papéis (RBAC)</CardTitle>
          <CardDescription>CRUD de perfis e atribuição de permissões por módulo/ação.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(
            Array.isArray(roles.list.data) ? roles.list.data : (roles.list.data && (roles.list.data as any).items) || []
          ).map((role: any) => (
            <div key={role.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-semibold">{role.name}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    roles.assignPermissions.mutateAsync({
                      id: role.id,
                      permissions: role.permissions,
                    })
                  }
                >
                  <Shield className="mr-1 h-4 w-4" />
                  Salvar
                </Button>
              </div>
              <div className="grid gap-2">
                {permissionsCatalog.map((perm) => {
                  const checked = rolePermissionIds[role.id]?.has(perm.id);
                  return (
                    <label key={perm.id} className="flex items-start gap-2 rounded-md border p-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => {
                          const updated = checked
                            ? role.permissions.filter((p: any) => p.id !== perm.id)
                            : [...role.permissions, perm];
                          roles.update.mutate({ id: role.id, data: { permissions: updated } });
                        }}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{perm.id}</div>
                        <div className="text-xs text-muted-foreground">{perm.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
