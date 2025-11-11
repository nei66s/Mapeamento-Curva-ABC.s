"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TechnicalReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const reportSchema = z.object({
  title: z.string().min(3, 'O título deve ter ao menos 3 caracteres'),
  technicianId: z.string().min(1, 'Selecione um técnico'),
  incidentId: z.string().optional(),
  details: z.object({
    itemDescription: z.string().optional(),
    itemPatrimony: z.string().optional(),
    itemQuantity: z.number().optional(),
    itemLocation: z.string().optional(),
    itemState: z.enum(['damaged', 'partial', 'obsolete', 'unused']).optional(),
    problemFound: z.string().min(5, 'Descreva o problema encontrado'),
    itemDiagnosis: z.string().optional(),
  repairViable: z.enum(['yes', 'no']).optional(),
    recommendations: z.enum(['repair', 'discard', 'evaluate']).optional(),
    actionsTaken: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof reportSchema>;

type Props = {
  report?: TechnicalReport | null;
  incidents?: { id: string; itemName?: string }[];
  technicians?: { id: string; name: string }[];
  onSubmit: (values: Omit<TechnicalReport, 'id' | 'createdAt' | 'status'>) => void;
  onCancel?: () => void;
};

export function ReportForm({ report, incidents = [], technicians = [], onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: report ? {
      title: report.title,
      technicianId: report.technicianId,
      incidentId: report.incidentId,
      details: {
        itemDescription: report.details.itemDescription,
        itemPatrimony: report.details.itemPatrimony,
        itemQuantity: report.details.itemQuantity,
        itemLocation: report.details.itemLocation,
        itemState: report.details.itemState as any,
        problemFound: report.details.problemFound,
        itemDiagnosis: report.details.itemDiagnosis,
  repairViable: report.details.repairViable as any,
        recommendations: ['repair', 'discard', 'evaluate'].includes(String(report.details.recommendations))
          ? (report.details.recommendations as 'repair' | 'discard' | 'evaluate')
          : undefined,
        actionsTaken: report.details.actionsTaken ?? '',
      }
    } : undefined
  });

  const submit = (data: FormValues) => {
    onSubmit({
      title: data.title,
      technicianId: data.technicianId,
      incidentId: data.incidentId,
      details: data.details,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {/* Section: Item data (from technical-evaluation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="itemDescription">Descrição do item</Label>
          <Input id="itemDescription" {...register('details.itemDescription')} placeholder="Ex: Ar Condicionado Split 12.000 BTUs" />
        </div>
        <div>
          <Label htmlFor="itemPatrimony">Número de patrimônio</Label>
          <Input id="itemPatrimony" {...register('details.itemPatrimony')} placeholder="PM-123456" />
        </div>
        <div>
          <Label htmlFor="itemQuantity">Quantidade</Label>
          <Input id="itemQuantity" type="number" {...register('details.itemQuantity', { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="itemLocation">Localização</Label>
          <Input id="itemLocation" {...register('details.itemLocation')} placeholder="Loja 10 - Campinas" />
        </div>
      </div>

      {/* Section: Technical evaluation fields */}
      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" {...register('title')} aria-invalid={!!errors.title} placeholder="Título do laudo" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="technician">Técnico</Label>
        <select id="technician" className="w-full rounded-md border px-3 py-2" {...register('technicianId')}>
          <option value="">-- selecione --</option>
          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {errors.technicianId && <p className="text-sm text-destructive">{errors.technicianId.message}</p>}
      </div>

      <div>
        <Label htmlFor="incident">Incidente (opcional)</Label>
        <select id="incident" className="w-full rounded-md border px-3 py-2" {...register('incidentId')}>
          <option value="">-- nenhum --</option>
          {incidents.map(i => <option key={i.id} value={i.id}>{i.id} {i.itemName ? ` — ${i.itemName}` : ''}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Estado do item</Label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" value="damaged" {...register('details.itemState')} />
            <span>Totalmente danificado</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="partial" {...register('details.itemState')} />
            <span>Parcialmente funcional</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="obsolete" {...register('details.itemState')} />
            <span>Obsoleto</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="unused" {...register('details.itemState')} />
            <span>Fora de uso prolongado</span>
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="itemDiagnosis">Diagnóstico técnico detalhado</Label>
        <textarea id="itemDiagnosis" {...register('details.itemDiagnosis')} className="w-full rounded-md border px-3 py-2 min-h-[100px]" placeholder="Descreva os testes e a causa provável" />
      </div>

      <div>
        <Label>Reparo viável?</Label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2"><input type="radio" value="yes" {...register('details.repairViable')} /> <span>Sim</span></label>
          <label className="flex items-center gap-2"><input type="radio" value="no" {...register('details.repairViable')} /> <span>Não</span></label>
        </div>
      </div>

      <div>
        <Label>Recomendações</Label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2"><input type="radio" value="repair" {...register('details.recommendations')} /> <span>Reparo / Reutilização</span></label>
          <label className="flex items-center gap-2"><input type="radio" value="discard" {...register('details.recommendations')} /> <span>Descarte como sucata</span></label>
          <label className="flex items-center gap-2"><input type="radio" value="evaluate" {...register('details.recommendations')} /> <span>Encaminhar para patrimônio</span></label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technician name/role removed from the report form — managed in the Technicians panel */}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>}
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
