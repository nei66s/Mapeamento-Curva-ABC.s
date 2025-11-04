
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, Bell, Languages, AppWindow, Rows3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


export default function SettingsPage() {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState({
    incidents: true,
    compliance: false,
    reports: true,
  });
   const [language, setLanguage] = useState('pt-br');
   const [density, setDensity] = useState('default');
   const [defaultPage, setDefaultPage] = useState('/dashboard/indicators');


  const { toast } = useToast();

  const handleThemeChange = (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    setTheme(newTheme);
    // In a real app, you'd also apply this to the documentElement
    document.documentElement.classList.toggle('dark', isDark);
    toast({
      title: 'Tema Alterado!',
      description: `O tema foi alterado para ${isDark ? 'Escuro' : 'Claro'}.`,
    });
  };

  const handleNotificationChange = (id: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [id]: value }));
     toast({
      title: 'Notificação Alterada!',
      description: 'Sua preferência de notificação foi salva.',
    });
  };

  const handleSettingChange = (settingName: string, value: string) => {
    toast({
      title: 'Configuração Salva!',
      description: `Sua preferência de ${settingName} foi atualizada.`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Configurações"
        description="Ajuste as preferências do aplicativo."
      />

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 transition-all" />
                /
                <Moon className="h-5 w-5 transition-all" />
              </div>
              <Label htmlFor="theme-switch">Tema Claro / Escuro</Label>
            </div>
            <Switch
              id="theme-switch"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeChange}
            />
          </div>

          <div className="flex items-start justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Rows3 />
                <Label>Densidade de Exibição</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione o quão compacto as informações são exibidas.
              </p>
            </div>
             <RadioGroup 
                defaultValue="default" 
                className="flex items-center gap-4"
                onValueChange={(value) => {
                  setDensity(value);
                  handleSettingChange('densidade', value);
                }}
              >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="density-compact" />
                <Label htmlFor="density-compact">Compacta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="density-default" />
                <Label htmlFor="density-default">Padrão</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Preferências Gerais</CardTitle>
           <CardDescription>Ajuste o idioma e a navegação padrão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Languages />
                  <Label htmlFor="language-select">Idioma da Interface</Label>
                </div>
                 <Select 
                    defaultValue="pt-br"
                    onValueChange={(value) => {
                      setLanguage(value);
                      handleSettingChange('idioma', value);
                    }}
                  >
                    <SelectTrigger id="language-select" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                      <SelectItem value="en-us">English (US)</SelectItem>
                       <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <AppWindow />
                  <Label htmlFor="default-page-select">Página Inicial Padrão</Label>
                </div>
                 <Select 
                    defaultValue="/dashboard/indicators"
                    onValueChange={(value) => {
                      setDefaultPage(value);
                      handleSettingChange('página inicial', value);
                    }}
                  >
                    <SelectTrigger id="default-page-select" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/dashboard/indicators">Indicadores</SelectItem>
                      <SelectItem value="/dashboard/incidents">Incidentes</SelectItem>
                       <SelectItem value="/dashboard/compliance">Conformidade</SelectItem>
                       <SelectItem value="/dashboard/matrix">Matriz de Itens</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Escolha quais notificações por e-mail você deseja receber.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="incidents-notification" className="flex items-center gap-3">
              <Bell />
              <span>Novos incidentes críticos (Curva A)</span>
            </Label>
            <Switch
              id="incidents-notification"
              checked={notifications.incidents}
              onCheckedChange={(checked) => handleNotificationChange('incidents', checked)}
            />
          </div>
           <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="compliance-notification" className="flex items-center gap-3">
              <Bell />
              <span>Lembretes de checklist de conformidade</span>
            </Label>
            <Switch
              id="compliance-notification"
              checked={notifications.compliance}
              onCheckedChange={(checked) => handleNotificationChange('compliance', checked)}
            />
          </div>
           <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="reports-notification" className="flex items-center gap-3">
              <Bell />
              <span>Relatórios mensais de desempenho</span>
            </Label>
            <Switch
              id="reports-notification"
              checked={notifications.reports}
              onCheckedChange={(checked) => handleNotificationChange('reports', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
