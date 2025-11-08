'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModuleDefinition } from '@/lib/permissions-config';
import { UserRole } from '@/lib/types';

interface PermissionsMatrixProps {
  permissions: Record<UserRole, Record<string, boolean>>;
  roles: UserRole[];
  modules: ModuleDefinition[];
  disabledRoles?: UserRole[];
  onToggle?: (role: UserRole, moduleId: string, allowed: boolean) => void;
}

export function PermissionsMatrix({
  permissions,
  roles,
  modules,
  disabledRoles = ['admin'],
  onToggle,
}: PermissionsMatrixProps) {
  const canEdit = Boolean(onToggle);
  const isRoleDisabled = (role: UserRole) => disabledRoles?.includes(role);

  const handleChange = (role: UserRole, moduleId: string, checked: boolean) => {
    if (!canEdit || isRoleDisabled(role) || !onToggle) return;
    onToggle(role, moduleId, checked);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Módulo</TableHead>
          {roles.map(role => (
            <TableHead key={role} className="text-center capitalize">
              {role}
            </TableHead>
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
                  onCheckedChange={(checked) => handleChange(role, module.id, Boolean(checked))}
                  disabled={!canEdit || isRoleDisabled(role)}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
