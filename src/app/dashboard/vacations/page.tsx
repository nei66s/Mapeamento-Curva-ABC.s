"use client";

import React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { detectConflicts, findAllOverlaps, type Vacation as LVac } from "@/lib/vacations";
import VacationConflictModal from "@/components/vacations/vacation-conflict-modal";

interface Employee {
  id: string;
  name: string;
}

type Vacation = {
  id: string;
  employeeId: string;
  from: Date;
  to: Date;
};

const MOCK_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Alice" },
  { id: "e2", name: "Bruno" },
  { id: "e3", name: "Carla" },
  { id: "e4", name: "Diego" },
  { id: "e5", name: "Elisa" },
];

// simple color palette for employees (keep Tailwind classes static)
const EMPLOYEE_COLORS: Record<string, string> = {
  e1: "bg-rose-200/80",
  e2: "bg-amber-200/80",
  e3: "bg-sky-200/80",
  e4: "bg-emerald-200/80",
  e5: "bg-violet-200/80",
};

// hex colors to use for inline styles (used by modifiersStyles as fallback)
const EMPLOYEE_HEX: Record<string, string> = {
  e1: "#fecdd3", // rose-200
  e2: "#fde68a", // amber-200
  e3: "#7dd3fc", // sky-300-ish
  e4: "#34d399", // emerald-400-ish
  e5: "#c4b5fd", // violet-200-ish
};

export default function VacationsPage() {
  const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [vacations, setVacations] = useState<Vacation[]>([
    // pre-populate for demo
    { id: "v1", employeeId: "e1", from: new Date("2025-08-03"), to: new Date("2025-08-07") },
    { id: "v2", employeeId: "e2", from: new Date("2025-08-05"), to: new Date("2025-08-12") },
    { id: "v3", employeeId: "e3", from: new Date("2025-08-20"), to: new Date("2025-08-25") },
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState<string>(employees[0]?.id ?? "");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'roadmap'>('year');
  const [expandedCalendar, setExpandedCalendar] = useState(false);

  // pending vacation when a conflict is detected and the user needs to confirm/force
  const [pendingVacation, setPendingVacation] = useState<LVac | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictList, setConflictList] = useState<Array<LVac & { employeeName?: string }>>([]);

  const addVacation = () => {
    if (!selectedEmployee || !range?.from || !range?.to) return;
    const id = `v${Math.random().toString(36).slice(2, 7)}`;
    const candidate: LVac = { id, employeeId: selectedEmployee, from: range.from!, to: range.to! };

    const conflicts = detectConflicts(vacations, candidate);
    if (conflicts.length > 0) {
      // attach employee names for display
      const mapped = conflicts.map(c => ({ ...c, employeeName: employees.find(e => e.id === c.employeeId)?.name }));
      setPendingVacation(candidate);
      setConflictList(mapped);
      setConflictModalOpen(true);
      return;
    }

    setVacations(prev => [...prev, candidate]);
    setRange(undefined);
  };

  const removeVacation = (id: string) => setVacations(prev => prev.filter(v => v.id !== id));

  // collisions: find overlapping vacations between different employees
  const overlaps = useMemo(() => {
    const list: Array<{ a: Vacation; b: Vacation }> = [];
    for (let i = 0; i < vacations.length; i++) {
      for (let j = i + 1; j < vacations.length; j++) {
        const a = vacations[i];
        const b = vacations[j];
        // overlap if a.from <= b.to && b.from <= a.to
        if (a.from <= b.to && b.from <= a.to) {
          // consider overlap only if different employees
          if (a.employeeId !== b.employeeId) list.push({ a, b });
        }
      }
    }
    return list;
  }, [vacations]);

  // set of vacation ids that participate in any overlap (for badge display)
  const conflictIds = useMemo(() => {
    const pairs = findAllOverlaps(vacations as any);
    const s = new Set<string>();
    pairs.forEach(([a, b]) => {
      s.add(a.id);
      s.add(b.id);
    });
    return s;
  }, [vacations]);

  // modifiers for DayPicker: create a modifier per vacation id
  const modifiers = useMemo(() => {
    const obj: Record<string, { from: Date; to: Date } | Date> = {};
    vacations.forEach(v => {
      obj[`vac-${v.id}`] = { from: v.from, to: v.to };
      // add duplicate modifier for conflict visualization only when this vacation is in a conflict
      if (conflictIds.has(v.id)) {
        obj[`conf-${v.id}`] = { from: v.from, to: v.to };
      }
    });
    return obj;
  }, [vacations]);

  const modifiersClassNames = useMemo(() => {
    const obj: Record<string, string> = {};
    vacations.forEach(v => {
      const cls = EMPLOYEE_COLORS[v.employeeId] ?? "bg-gray-200/60";
      obj[`vac-${v.id}`] = `rounded-md ${cls}`;
      // conflict class (uses outline) - only visible when CSS applies
      obj[`conf-${v.id}`] = `rdp-conflict-outline`;
    });
    return obj;
  }, [vacations]);

  // Inline style fallback for modifiers (helps when Tailwind classes don't apply to DayPicker internals)
  const modifiersStyles = useMemo(() => {
    const obj: Record<string, React.CSSProperties> = {};
    vacations.forEach(v => {
      const hex = EMPLOYEE_HEX[v.employeeId] ?? '#e5e7eb';
      obj[`vac-${v.id}`] = { backgroundColor: hex, borderRadius: '0.375rem' };
      // conflict style: light red border around the range
      obj[`conf-${v.id}`] = { boxShadow: 'inset 0 0 0 2px rgba(239,68,68,0.9)', borderRadius: '0.375rem' };
    });
    // highlight days where more than one person is on vacation
    const dateCounts: Record<string, number> = {};
    vacations.forEach(v => {
      const d = new Date(v.from);
      while (d <= v.to) {
        const key = d.toISOString().slice(0,10);
        dateCounts[key] = (dateCounts[key] || 0) + 1;
        d.setDate(d.getDate() + 1);
      }
    });
    Object.entries(dateCounts).forEach(([day, cnt]) => {
      if (cnt > 1) {
        // DayPicker modifier for that exact day
        obj[`multi-${day}`] = { backgroundColor: 'rgba(239,68,68,0.12)', boxShadow: 'inset 0 0 0 2px rgba(239,68,68,0.9)', borderRadius: '0.375rem' };
      }
    });
    return obj;
  }, [vacations]);

  // choose a year to display: prefer existing vacations year (if any), else current year
  const displayYear = useMemo(() => {
    if (vacations.length === 0) return new Date().getFullYear();
    // pick the most common year among vacations (simple heuristic)
    const counts: Record<number, number> = {};
    vacations.forEach(v => {
      const y = v.from.getFullYear();
      counts[y] = (counts[y] || 0) + 1;
    });
    let best = new Date().getFullYear();
    let max = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > max) { max = v; best = Number(k); }
    });
    return best;
  }, [vacations]);

  const handleForceAdd = () => {
    if (!pendingVacation) return;
    setVacations(prev => [...prev, pendingVacation]);
    setPendingVacation(null);
    setConflictList([]);
    setConflictModalOpen(false);
    setRange(undefined);
  };

  const handleCancelConflict = () => {
    setPendingVacation(null);
    setConflictList([]);
    setConflictModalOpen(false);
  };

  // Roadmap controls: granularity (month | week | day), zoom (affects column width)
  const [roadmapGranularity, setRoadmapGranularity] = useState<'month' | 'week' | 'day'>('month');
  const [zoom, setZoom] = useState<number>(1); // 1 = default
  const roadmapRef = useRef<HTMLDivElement | null>(null);
  const isPanning = useRef(false);
  const panStartX = useRef(0);
  const panStartScroll = useRef(0);

  useEffect(() => {
    const el = roadmapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // horizontal scroll with shift or trackpad: let it scroll
      if (Math.abs(e.deltaX) > 0 || e.shiftKey) return;
      // vertical wheel: translate to horizontal scroll when roadmap is active and granularity is fine-grained
      if (roadmapGranularity !== 'month') {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel' as any, onWheel as any);
  }, [roadmapGranularity]);

  // helpers to generate units for the selected displayYear
  const getDaysOfYear = (year: number) => {
    const d = new Date(year, 0, 1);
    const arr: Date[] = [];
    while (d.getFullYear() === year) {
      arr.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return arr;
  };

  const getWeekStartsOfYear = (year: number) => {
    // week starts on Monday; keep a simple approach grouping 7-day windows starting from Jan 1
    const list: Date[] = [];
    const d = new Date(year, 0, 1);
    // align to Monday
    const day = d.getDay(); // 0=Sun,1=Mon...
    const shift = day === 1 ? 0 : (day === 0 ? 1 : (8 - day));
    const first = new Date(d);
    first.setDate(d.getDate() + shift);
    let cur = new Date(first);
    if (cur.getFullYear() !== year) cur = new Date(year, 0, 1);
    while (cur.getFullYear() === year) {
      list.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }
    return list;
  };

  // compute units (labels and index mapping) for roadmap header
  const roadmapUnits = useMemo(() => {
    if (roadmapGranularity === 'month') {
      return [...Array(12)].map((_, i) => ({
        key: `${displayYear}-${i}`,
        label: new Date(displayYear, i).toLocaleString('default', { month: 'short' }),
        start: new Date(displayYear, i, 1),
        end: new Date(displayYear, i + 1, 0),
      }));
    }
    if (roadmapGranularity === 'week') {
      const weeks = getWeekStartsOfYear(displayYear);
      return weeks.map((w, idx) => ({
        key: `${displayYear}-w${idx}`,
        label: `W${idx + 1}`,
        start: new Date(w),
        end: new Date(new Date(w).setDate(w.getDate() + 6)),
      }));
    }
    // day granularity
    const days = getDaysOfYear(displayYear);
    return days.map(d => ({ key: d.toISOString().slice(0,10), label: `${d.getDate()}/${d.getMonth()+1}`, start: new Date(d), end: new Date(d) }));
  }, [roadmapGranularity, displayYear]);

  // base column width per granularity (px) multiplied by zoom
  const baseColWidth = roadmapGranularity === 'month' ? 72 : roadmapGranularity === 'week' ? 40 : 18;
  const colWidth = Math.max(8, Math.round(baseColWidth * zoom));

  // pan handlers for dragging the roadmap horizontally
  const startPan = (clientX: number) => {
    const el = roadmapRef.current;
    if (!el) return;
    isPanning.current = true;
    panStartX.current = clientX;
    panStartScroll.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };
  const movePan = (clientX: number) => {
    const el = roadmapRef.current;
    if (!el || !isPanning.current) return;
    const dx = clientX - panStartX.current;
    el.scrollLeft = panStartScroll.current - dx;
  };
  const endPan = () => {
    const el = roadmapRef.current;
    if (!el) return;
    isPanning.current = false;
    el.style.cursor = 'auto';
  };

  return (
      <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Calendário de Férias</h1>
      <style>{`
        /* Aggressive compact year view for DayPicker - tuned to fit 12 months
           Increased vertical space so months are taller and distributed better */
        .rdp-compact .rdp-month {
          padding: 0.25rem !important;
          border-radius: 0.35rem;
          min-width: 0 !important;
          min-height: 260px; /* larger month height to double vertical space */
        }
        .rdp-compact .rdp-caption {
          font-size: 0.75rem !important;
          padding-bottom: 0.15rem !important;
        }
        .rdp-compact .rdp-day {
          width: 1.2rem !important;
          height: 1.2rem !important;
          line-height: 1.2rem !important;
          font-size: 0.6rem !important;
          padding: 0 !important;
          margin: 0.04rem !important;
        }
        .rdp-compact .rdp-weekdays {
          font-size: 0.6rem !important;
          padding-bottom: 0.15rem !important;
        }
        /* increase row height for the grid so months distribute vertically (doubles vertical space) */
        .rdp-year-grid { gap: 0.5rem; grid-auto-rows: 280px; }
        /* ensure conflict marker is visible but compact */
        .rdp-compact .rdp-day.rdp-day_selected, .rdp-compact .rdp-day.rdp-day_range_start, .rdp-compact .rdp-day.rdp-day_range_end {
          border-radius: 0.25rem !important;
        }
        /* compact month header */
        .rdp-compact .rdp-caption_label { font-weight: 600; font-size: 0.8rem !important; }
        /* roadmap coloring: use data-emp attribute to color month blocks per employee */
        .rdp-compact [data-emp="e1"] { background-color: #fecdd3; opacity: 0.95; }
        .rdp-compact [data-emp="e2"] { background-color: #fde68a; opacity: 0.95; }
        .rdp-compact [data-emp="e3"] { background-color: #7dd3fc; opacity: 0.95; }
        .rdp-compact [data-emp="e4"] { background-color: #34d399; opacity: 0.95; }
        .rdp-compact [data-emp="e5"] { background-color: #c4b5fd; opacity: 0.95; }
        .rdp-roadmap-conflict { box-shadow: inset 0 0 0 2px rgba(239,68,68,0.9); }
        /* Roadmap grid helpers (uses --col-w set dynamically in JSX) */
        .rdp-roadmap-root { --col-w: 72px; }
        .rdp-roadmap-grid { display: grid; grid-auto-flow: column; grid-auto-columns: var(--col-w); gap: 0.25rem; align-items: center; }
        .rdp-roadmap-unit { width: var(--col-w); min-width: var(--col-w); max-width: var(--col-w); box-sizing: border-box; overflow: hidden; }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-end gap-2 mb-2">
              <button
                className={`px-2 py-1 rounded ${viewMode === 'month' ? 'bg-primary text-white' : 'bg-muted'}`}
                onClick={() => setViewMode('month')}
              >Mês</button>
              <button
                className={`px-2 py-1 rounded ${viewMode === 'year' ? 'bg-primary text-white' : 'bg-muted'}`}
                onClick={() => setViewMode('year')}
              >Ano</button>
                <button
                  className={`px-2 py-1 rounded ${viewMode === 'roadmap' ? 'bg-primary text-white' : 'bg-muted'}`}
                  onClick={() => setViewMode('roadmap')}
                >Roadmap</button>
              <button
                className={`px-2 py-1 rounded ${expandedCalendar ? 'bg-destructive text-white' : 'bg-muted'}`}
                onClick={() => setExpandedCalendar(v => !v)}
                title={expandedCalendar ? 'Fechar visualização expandida' : 'Expandir calendário'}
              >{expandedCalendar ? 'Fechar' : 'Expandir'}</button>

              {/* Roadmap extras: granularity and zoom */}
              {viewMode === 'roadmap' && (
                <div className="flex items-center gap-2 ml-2">
                  <label htmlFor="roadmap-granularity" className="text-xs">Granularidade:</label>
                  <select id="roadmap-granularity" value={roadmapGranularity} onChange={(e) => setRoadmapGranularity(e.target.value as any)} className="border rounded px-2 py-1 text-xs">
                    <option value="month">Mês</option>
                    <option value="week">Semana</option>
                    <option value="day">Dia</option>
                  </select>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="px-2 py-1 rounded bg-muted text-sm" onClick={() => setZoom(z => Math.max(0.3, +(z - 0.2).toFixed(2)))} title="Diminuir zoom">−</button>
                    <div className="text-xs">Zoom</div>
                    <button className="px-2 py-1 rounded bg-muted text-sm" onClick={() => setZoom(z => Math.min(3, +(z + 0.2).toFixed(2)))} title="Aumentar zoom">+</button>
                    <button className="px-2 py-1 rounded bg-muted text-sm ml-1" onClick={() => setZoom(1)} title="Resetar zoom">Reset</button>
                  </div>
                </div>
              )}
            </div>

            <div className={expandedCalendar ? 'w-full min-h-[88vh]' : 'w-full'}>
              {viewMode === 'roadmap' ? (
                // Roadmap view: flexible grid of employees x units (months/weeks/days)
                <div className="w-full overflow-auto" ref={roadmapRef}
                     onMouseDown={(e) => startPan(e.clientX)}
                     onMouseMove={(e) => movePan(e.clientX)}
                     onMouseUp={() => endPan()}
                     onMouseLeave={() => endPan()}
                     onTouchStart={(e) => startPan(e.touches[0].clientX)}
                     onTouchMove={(e) => movePan(e.touches[0].clientX)}
                     onTouchEnd={() => endPan()}
                >
                  {/* dynamic variable for column width (avoids inline style attributes) */}
                  <style>{`.rdp-roadmap-root { --col-w: ${colWidth}px }`}</style>
                  <div className="w-full bg-muted p-2 rounded mb-2 overflow-hidden rdp-roadmap-root">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <div className="w-36" />
                      <div className="flex-1 overflow-hidden">
                        <div className="rdp-roadmap-grid rdp-roadmap-units">
                          {roadmapUnits.map((u, i) => (
                            <div key={u.key} className="rdp-roadmap-unit text-center py-1 text-xs truncate" title={u.label}>{u.label}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    {employees.map(emp => {
                      // for each unit, check if employee has vacation intersecting the unit
                      return (
                        <div key={emp.id} className="flex items-center gap-3 mb-2">
                          <div className="w-36 flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${EMPLOYEE_COLORS[emp.id] ?? 'bg-gray-200/60'}`} />
                            <div className="text-sm">{emp.name}</div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="rdp-roadmap-grid" >
                              {roadmapUnits.map((u, idx) => {
                                // check if any vacation for this employee intersects the unit window
                                const has = vacations.some(v => {
                                  if (v.employeeId !== emp.id) return false;
                                  return !(v.to < u.start || v.from > u.end);
                                });
                                // global conflict if more than 1 employee intersects this unit
                                const globalCount = (() => {
                                  const set = new Set<string>();
                                  vacations.forEach(v => {
                                    if (!(v.to < u.start || v.from > u.end)) set.add(v.employeeId);
                                  });
                                  return set.size;
                                })();
                                const conflictUnit = globalCount > 1;
                                const title = vacations.filter(v => v.employeeId === emp.id && !(v.to < u.start || v.from > u.end)).map(b => `${b.from.toLocaleDateString()}→${b.to.toLocaleDateString()}`).join('; ');
                                return (
                                  <div key={u.key} title={title} className={`h-8 rounded text-center text-xs relative rdp-roadmap-unit`}>
                                    {has && (
                                      <div className="absolute inset-0 rounded" data-emp={emp.id} />
                                    )}
                                    {conflictUnit && (
                                      <div className="absolute inset-0 rounded rdp-roadmap-conflict" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <DayPicker
                  className={viewMode === 'year' ? 'rdp-year-grid rdp-compact grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : undefined}
                  mode="range"
                  selected={range}
                  onSelect={setRange as any}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  modifiersStyles={modifiersStyles}
                  captionLayout="dropdown"
                  month={viewMode === 'year' ? new Date(displayYear, 0) : new Date(displayYear, 7)}
                  numberOfMonths={viewMode === 'year' ? 12 : 1}
                  fromDate={viewMode === 'year' ? new Date(displayYear, 0, 1) : undefined}
                  toDate={viewMode === 'year' ? new Date(displayYear, 11, 31) : undefined}
                />
              )}
            </div>
          </div>

          {!expandedCalendar && (
            <>
              <div className="mt-3 flex items-center gap-3">
            <label htmlFor="employee-select" className="sr-only">Selecionar funcionário</label>
            <select
              id="employee-select"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border rounded px-2 py-1"
              aria-label="Selecionar funcionário para férias"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <button onClick={addVacation} className="bg-primary text-white px-3 py-1 rounded disabled:opacity-50" disabled={!range?.from || !range?.to}>
              Adicionar Férias
            </button>
            <div className="text-sm text-muted-foreground">{range?.from ? range.from.toLocaleDateString() : '-'} → {range?.to ? range.to.toLocaleDateString() : '-'}</div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Férias Agendadas</h3>
            <div className="space-y-2">
              {vacations.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma férias agendada.</div>}
              {vacations.map(v => {
                const emp = employees.find(e => e.id === v.employeeId)?.name ?? v.employeeId;
                const isConflict = conflictIds.has(v.id);
                return (
                  <div key={v.id} className="flex items-center justify-between bg-muted p-2 rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{emp}</span>
                        {isConflict && (
                          <span className="inline-flex items-center text-xs bg-red-100 text-destructive px-2 py-0.5 rounded">Conflito</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{v.from.toLocaleDateString()} → {v.to.toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeVacation(v.id)} className="text-sm text-destructive">Remover</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          )}
        </div>

        <aside className="lg:col-span-3">
          <div className="bg-white border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium">Legenda</h3>
            <div className="grid grid-cols-1 gap-2">
              {employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${EMPLOYEE_COLORS[emp.id] ?? 'bg-gray-200/60'}`} />
                  <div className="text-sm">{emp.name}</div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-medium">Conflitos</h4>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100/90 border border-red-400" />
                <div className="text-sm">Dia com 2+ pessoas (Conflito)</div>
              </div>
              {overlaps.length === 0 ? (
                <div className="text-sm text-muted-foreground mt-2">Nenhum conflito detectado.</div>
              ) : (
                <div className="text-sm space-y-2 mt-2">
                  {overlaps.map((o, idx) => (
                    <div key={idx} className="border p-2 rounded">
                      <div className="font-medium">{employees.find(e => e.id === o.a.employeeId)?.name} ↔ {employees.find(e => e.id === o.b.employeeId)?.name}</div>
                      <div className="text-xs text-muted-foreground">{o.a.from.toLocaleDateString()} → {o.a.to.toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
      <VacationConflictModal open={conflictModalOpen} conflicts={conflictList} onClose={handleCancelConflict} onForceAdd={handleForceAdd} />
    </div>
  );
}
