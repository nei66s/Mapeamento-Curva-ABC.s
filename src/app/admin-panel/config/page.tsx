'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSystemConfig } from '@/hooks/use-system-config';
import { useToast } from '@/hooks/use-toast';

export default function ConfigPage() {
  const { query, update, updateMonitoring, updateSecurity } = useSystemConfig();
  const { toast } = useToast();
  const [nameOverride, setNameOverride] = useState<string>();
  const [logoUrlOverride, setLogoUrlOverride] = useState<string>();
  const [timezoneOverride, setTimezoneOverride] = useState<string>();
  const [localeOverride, setLocaleOverride] = useState<string>();
  const [trackingEnabledOverride, setTrackingEnabledOverride] = useState<boolean>();
  const [errorAlertThresholdOverride, setErrorAlertThresholdOverride] = useState<number>();
  const [rpmAlertThresholdOverride, setRpmAlertThresholdOverride] = useState<number>();
  const [sessionExpirationMinutesOverride, setSessionExpirationMinutesOverride] = useState<number>();
  const [minLengthOverride, setMinLengthOverride] = useState<number>();
  const [requireNumberOverride, setRequireNumberOverride] = useState<boolean>();
  const [requireSpecialOverride, setRequireSpecialOverride] = useState<boolean>();

  const data = query.data;
  const name = nameOverride ?? data?.name ?? '';
  const logoUrl = logoUrlOverride ?? data?.logoUrl ?? '';
  const timezone = timezoneOverride ?? data?.defaultTimezone ?? '';
  const locale = localeOverride ?? data?.defaultLocale ?? '';
  const trackingEnabled = trackingEnabledOverride ?? data?.monitoring?.trackingEnabled ?? false;
  const errorAlertThreshold = errorAlertThresholdOverride ?? data?.monitoring?.errorAlertThreshold ?? 0;
  const rpmAlertThreshold = rpmAlertThresholdOverride ?? data?.monitoring?.rpmAlertThreshold ?? 0;
  const sessionExpirationMinutes = sessionExpirationMinutesOverride ?? data?.security?.sessionExpirationMinutes ?? 60;
  const minLength = minLengthOverride ?? data?.security?.passwordPolicy.minLength ?? 10;
  const requireNumber = requireNumberOverride ?? data?.security?.passwordPolicy.requireNumber ?? true;
  const requireSpecial = requireSpecialOverride ?? data?.security?.passwordPolicy.requireSpecial ?? true;

  const saveGeneral = async () => {
    await update.mutateAsync({
      name,
      logoUrl,
      defaultTimezone: timezone,
      defaultLocale: locale,
    });
    toast({ title: 'Configuração salva', description: 'Dados gerais atualizados.' });
  };

  const saveSecurity = async () => {
    await updateSecurity.mutateAsync({
      sessionExpirationMinutes,
      passwordPolicy: {
        minLength,
        requireNumber,
        requireSpecial,
      },
    });
    toast({ title: 'Segurança atualizada', description: 'Política aplicada.' });
  };

  const saveMonitoring = async () => {
    await updateMonitoring.mutateAsync({
      trackingEnabled,
      errorAlertThreshold,
      rpmAlertThreshold,
    });
    toast({ title: 'Monitoramento salvo', description: 'Flags e thresholds aplicados.' });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações do Sistema"
        description="Defina nome, tema, timezone, política de senha e thresholds."
      />

      <Card>
        <CardHeader>
          <CardTitle>Configurações gerais</CardTitle>
          <CardDescription>Identidade do sistema e padrões de regionalização.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Nome do sistema</Label>
            <Input value={name} onChange={(e) => setNameOverride(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Logo (URL)</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrlOverride(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Timezone padrão</Label>
            <Input value={timezone} onChange={(e) => setTimezoneOverride(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Idioma padrão</Label>
            <Input value={locale} onChange={(e) => setLocaleOverride(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={saveGeneral}>Salvar gerais</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Expiração de sessão e política de senha.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Expiração da sessão (min)</Label>
            <Input
              type="number"
              value={sessionExpirationMinutes}
              onChange={(e) => setSessionExpirationMinutesOverride(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Mínimo de caracteres</Label>
            <Input type="number" value={minLength} onChange={(e) => setMinLengthOverride(Number(e.target.value))} />
          </div>
          <div className="grid gap-2">
            <Label>Requisitos</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <Switch checked={requireNumber} onCheckedChange={setRequireNumberOverride} /> Número
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={requireSpecial} onCheckedChange={setRequireSpecialOverride} /> Especial
              </label>
            </div>
          </div>
          <div className="md:col-span-3">
            <Button onClick={saveSecurity}>Salvar segurança</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitoramento</CardTitle>
          <CardDescription>Habilite tracking e thresholds de alerta.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Tracking de eventos</Label>
            <Switch checked={trackingEnabled} onCheckedChange={setTrackingEnabledOverride} />
          </div>
          <div className="grid gap-2">
            <Label>Threshold de erros/min</Label>
            <Input
              type="number"
              value={errorAlertThreshold}
              onChange={(e) => setErrorAlertThresholdOverride(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Threshold RPM</Label>
            <Input
              type="number"
              value={rpmAlertThreshold}
              onChange={(e) => setRpmAlertThresholdOverride(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-3">
            <Button onClick={saveMonitoring}>Salvar monitoramento</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
