"use client";

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Array<{id:string;name:string;role?:string}>>([]);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await fetch('/api/technicians');
      const data = await res.json();
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (err) {
      setTechnicians([]);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (name: string, role?: string) => {
    try {
      const res = await fetch('/api/technicians', { method: 'POST', body: JSON.stringify({ name, role }), headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const tech = await res.json();
        setTechnicians(prev => [tech, ...prev]);
        toast({ title: 'Técnico adicionado', description: `${name} adicionado.` });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar técnico.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha de rede.' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/technicians?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setTechnicians(prev => prev.filter(t => t.id !== id));
        toast({ title: 'Técnico removido' });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha de rede.' });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Técnicos" description="Gerencie técnicos que assinam e executam os laudos técnicos." />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Técnicos</CardTitle>
          <CardDescription>Adicione e remova técnicos que serão usados nos Laudos Técnicos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {technicians.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded px-3 py-2 border">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
                <div>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>Remover</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Dialog>
            <DialogTrigger asChild>
              <Button><PlusCircle /> Adicionar Técnico</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Técnico</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="newTechName">Nome</Label>
                <Input id="newTechName" placeholder="Nome do técnico" />
                <Label htmlFor="newTechRole">Função</Label>
                <Input id="newTechRole" placeholder="Cargo / função" />
                <div className="flex justify-end">
                  <Button onClick={() => {
                    const nameInput = (document.getElementById('newTechName') as HTMLInputElement | null);
                    const roleInput = (document.getElementById('newTechRole') as HTMLInputElement | null);
                    const name = nameInput?.value?.trim();
                    const role = roleInput?.value?.trim();
                    if (!name) { toast({ variant: 'destructive', title: 'Nome obrigatório' }); return; }
                    handleAdd(name, role);
                    if (nameInput) nameInput.value = '';
                    if (roleInput) roleInput.value = '';
                  }}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
