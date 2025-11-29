import { cloneDefaultPermissions } from '@/lib/permissions-config';

describe('RBAC defaults', () => {
  it('bloqueia módulos admin para visualizador e libera para admin', () => {
    const perms = cloneDefaultPermissions();
    expect(perms.visualizador['admin-dashboard']).toBe(false);
    expect(perms.visualizador['admin-modules']).toBe(false);
    expect(perms.admin['admin-dashboard']).toBe(true);
    expect(perms.admin['admin-modules']).toBe(true);
  });
});
