'use client';

import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useModules } from '@/hooks/use-modules';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTracking } from '@/hooks/use-tracking';
import { Rocket, Eye, FlaskConical, Power } from 'lucide-react';

export default function ModulesPage() {
  const { modules, flags, setActive, setVisible, markBeta, toggleFlag } = useModules();
  const { trackAction } = useTracking();

  const moduleList = Array.isArray(modules.data) ? modules.data : (modules.data && (modules.data as any).items) || [];
  const flagsList = Array.isArray(flags.data) ? flags.data : (flags.data && (flags.data as any).items) || [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Módulos e Feature Flags"
        description="Habilite/desabilite módulos, controle visibilidade e flags de experimento."
      />

      <Alert>
        <AlertTitle>Governança de módulos</AlertTitle>
        <AlertDescription>
          Módulos inativos são ocultados da sidebar e rotas são bloqueadas pelo front e middleware.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Módulos do sistema</CardTitle>
          <CardDescription>Controle de ativação, visibilidade e marcação beta.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {moduleList.map((module: any) => (
            <div key={module.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-semibold">{module.name}</div>
                  <div className="text-sm text-muted-foreground">{module.description}</div>
                </div>
                <Badge variant={module.active ? 'secondary' : 'destructive'}>
                  {module.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <Separator />
              <div className="grid gap-3">
                <label className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Power className="h-4 w-4" /> Ativar módulo
                  </span>
                  <Switch
                    checked={module.active}
                    onCheckedChange={(active) => {
                      setActive.mutate({ id: module.id, active });
                      trackAction('module.toggle', { module: module.id, active });
                    }}
                  />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Visível na sidebar
                  </span>
                  <Switch
                    checked={module.visibleInMenu}
                    onCheckedChange={(visible) => {
                      setVisible.mutate({ id: module.id, visible });
                      trackAction('module.visibility', { module: module.id, visible });
                    }}
                  />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" /> Marcar como beta
                  </span>
                  <Switch
                    checked={!!module.beta}
                    onCheckedChange={(beta) => {
                      markBeta.mutate({ id: module.id, beta });
                      trackAction('module.beta', { module: module.id, beta });
                    }}
                  />
                </label>
              </div>
              {module.dependencies?.length ? (
                <div className="text-xs text-muted-foreground">
                  Dependências: {module.dependencies.join(', ')}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
          <CardDescription>Auditoria de toggles por chave.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {flagsList.map((flag: any) => (
            <div key={flag.key} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{flag.label}</div>
                  <div className="text-xs text-muted-foreground">{flag.description}</div>
                </div>
                <Badge variant={flag.enabled ? 'secondary' : 'outline'}>{flag.moduleId}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <Rocket className="h-4 w-4" /> Ativar flag
                </span>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(enabled) => {
                    toggleFlag.mutate({ key: flag.key, enabled });
                    trackAction('flag.toggle', { flag: flag.key, enabled });
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
