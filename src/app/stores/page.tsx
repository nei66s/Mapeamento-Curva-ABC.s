"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import '@/lib/leaflet-init';
import 'leaflet/dist/leaflet.css';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trash2, Pencil, MapPin } from 'lucide-react';
import type { Store } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stores');
      if (!res.ok) throw new Error('Failed to load stores');
      const data: Store[] = await res.json();
      setStores(data);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar lojas.' });
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    try {
      if (leafletMapRef.current) {
        try {
          // Leaflet internals may have been partially torn down by React
          // (or removed elsewhere). Check for the container before
          // calling `remove()` to avoid accessing `_leaflet_events` on
          // an undefined element.
          const anyMap = leafletMapRef.current as any;
          if (anyMap && anyMap._container) {
            leafletMapRef.current.remove();
          } else if (anyMap && typeof anyMap.off === 'function') {
            // best-effort detach handlers if container is gone
            try { anyMap.off(); } catch (e) {}
          }
        } catch (err) {
          console.warn('Error removing leaflet map (ignored)', err);
        } finally {
          leafletMapRef.current = null;
        }
      }
      const map = L.map(mapRef.current).setView([-23.5, -46.6], 6);
      leafletMapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      stores.forEach((s) => {
        try {
          L.marker([s.lat || 0, s.lng || 0]).addTo(map).bindPopup(`<b>${s.name}</b><br>${s.city}`);
        } catch (e) {}
      });
    } catch (e) {
      console.error('map init error', e);
    }
    // rerun when stores change
    return () => {
      if (leafletMapRef.current) {
        try {
          const anyMap = leafletMapRef.current as any;
          if (anyMap && anyMap._container) anyMap.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
    };
  }, [stores]);

  const openNew = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (s: Store) => { setEditing(s); setIsFormOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar loja? Esta ação é irreversível.')) return;
    try {
      const res = await fetch(`/api/stores?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setStores(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Loja eliminada' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível eliminar a loja.' });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Lojas" description="Gerir lojas e localizações" />
      <div className="flex items-center justify-between">
        <div />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="flex items-center gap-2"><MapPin /> Nova Loja</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Loja' : 'Nova Loja'}</DialogTitle>
            </DialogHeader>
            <StoreForm initial={editing} onSaved={(s) => { setIsFormOpen(false); load(); }} onCancel={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Lojas</CardTitle>
            <CardDescription>{stores.length} lojas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stores.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{s.city} — {s.lat?.toFixed?.(4) ?? s.lat},{s.lng?.toFixed?.(4) ?? s.lng}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapa</CardTitle>
            <CardDescription>Visualize as lojas no mapa</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={mapRef} className="h-[480px] w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StoreForm({ initial, onSaved, onCancel }: { initial?: Store | null; onSaved: (s: Store) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [lat, setLat] = useState(initial?.lat?.toString() ?? '');
  const [lng, setLng] = useState(initial?.lng?.toString() ?? '');
  const { toast } = useToast();

  useEffect(() => {
    setName(initial?.name ?? ''); setCity(initial?.city ?? ''); setLat(initial?.lat?.toString() ?? ''); setLng(initial?.lng?.toString() ?? '');
  }, [initial]);

  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    try {
      const body: any = { name, location: city };
      if (lat) body.lat = Number(lat);
      if (lng) body.lng = Number(lng);
      const method = initial ? 'PUT' : 'POST';
      if (initial) body.id = initial.id;
      const res = await fetch('/api/stores', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('save failed');
      const saved = await res.json();
      toast({ title: initial ? 'Loja atualizada' : 'Loja criada' });
      onSaved(saved);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a loja.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nome</label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Cidade / Local</label>
        <Input value={city} onChange={e => setCity(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <Input value={lat} onChange={e => setLat(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <Input value={lng} onChange={e => setLng(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
