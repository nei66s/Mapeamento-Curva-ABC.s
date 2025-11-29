'use client';

import { useState, useEffect } from 'react';
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
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [timezone, setTimezone] = useState('');
  const [locale, setLocale] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [errorAlertThreshold, setErrorAlertThreshold] = useState(0);
  const [rpmAlertThreshold, setRpmAlertThreshold] = useState(0);
  const [sessionExpirationMinutes, setSessionExpirationMinutes] = useState(60);
  const [minLength, setMinLength] = useState(10);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(true);

  useEffect(() => {
    if (!query.data) return;
    setName(query.data.name);
    setLogoUrl(query.data.logoUrl || '');
    setTimezone(query.data.defaultTimezone);
    setLocale(query.data.defaultLocale);
    setTrackingEnabled(query.data.monitoring.trackingEnabled);
    setErrorAlertThreshold(query.data.monitoring.errorAlertThreshold);
    setRpmAlertThreshold(query.data.monitoring.rpmAlertThreshold);
    setSessionExpirationMinutes(query.data.security.sessionExpirationMinutes);
    setMinLength(query.data.security.passwordPolicy.minLength);
    setRequireNumber(query.data.security.passwordPolicy.requireNumber);
    setRequireSpecial(query.data.security.passwordPolicy.requireSpecial);
  }, [query.data]);

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
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Logo (URL)</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Timezone padrão</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Idioma padrão</Label>
            <Input value={locale} onChange={(e) => setLocale(e.target.value)} />
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
              onChange={(e) => setSessionExpirationMinutes(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Mínimo de caracteres</Label>
            <Input type="number" value={minLength} onChange={(e) => setMinLength(Number(e.target.value))} />
          </div>
          <div className="grid gap-2">
            <Label>Requisitos</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <Switch checked={requireNumber} onCheckedChange={setRequireNumber} /> Número
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={requireSpecial} onCheckedChange={setRequireSpecial} /> Especial
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
            <Switch checked={trackingEnabled} onCheckedChange={setTrackingEnabled} />
          </div>
          <div className="grid gap-2">
            <Label>Threshold de erros/min</Label>
            <Input
              type="number"
              value={errorAlertThreshold}
              onChange={(e) => setErrorAlertThreshold(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Threshold RPM</Label>
            <Input
              type="number"
              value={rpmAlertThreshold}
              onChange={(e) => setRpmAlertThreshold(Number(e.target.value))}
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
