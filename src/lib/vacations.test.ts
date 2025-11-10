import { describe, it, expect } from 'vitest';
import { detectConflicts } from './vacations';

describe('vacations.detectConflicts', () => {
  it('returns empty array when there are no conflicts', () => {
    const existing = [
      { id: 'a', employeeId: 'e1', from: new Date('2025-08-01'), to: new Date('2025-08-05') },
    ];
    const candidate = { id: 'b', employeeId: 'e2', from: new Date('2025-08-06'), to: new Date('2025-08-10') };
    const conflicts = detectConflicts(existing as any, candidate as any);
    expect(conflicts).toHaveLength(0);
  });

  it('detects overlapping vacations for different employees', () => {
    const existing = [
      { id: 'a', employeeId: 'e1', from: new Date('2025-08-01'), to: new Date('2025-08-10') },
      { id: 'c', employeeId: 'e3', from: new Date('2025-09-01'), to: new Date('2025-09-05') },
    ];
    const candidate = { id: 'b', employeeId: 'e2', from: new Date('2025-08-05'), to: new Date('2025-08-07') };
    const conflicts = detectConflicts(existing as any, candidate as any);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe('a');
  });
});
