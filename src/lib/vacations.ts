export type Vacation = {
  id: string;
  employeeId: string;
  from: Date;
  to: Date;
};

/**
 * Returns true if two date ranges overlap (inclusive)
 */
export function rangesOverlap(aFrom: Date, aTo: Date, bFrom: Date, bTo: Date) {
  return aFrom <= bTo && bFrom <= aTo;
}

/**
 * Given existing vacations and a candidate vacation, return the list of existing
 * vacations that conflict with the candidate (different employees only).
 */
export function detectConflicts(existing: Vacation[], candidate: Vacation) {
  const conflicts: Vacation[] = [];
  for (const v of existing) {
    if (v.employeeId === candidate.employeeId) continue; // same employee is fine
    if (rangesOverlap(v.from, v.to, candidate.from, candidate.to)) {
      conflicts.push(v);
    }
  }
  return conflicts;
}

/**
 * Detect all pairwise overlaps (useful for overview). Returns array of pairs [a,b]
 */
export function findAllOverlaps(vacations: Vacation[]) {
  const out: Array<[Vacation, Vacation]> = [];
  for (let i = 0; i < vacations.length; i++) {
    for (let j = i + 1; j < vacations.length; j++) {
      const a = vacations[i];
      const b = vacations[j];
      if (rangesOverlap(a.from, a.to, b.from, b.to) && a.employeeId !== b.employeeId) {
        out.push([a, b]);
      }
    }
  }
  return out;
}

export default {
  rangesOverlap,
  detectConflicts,
  findAllOverlaps,
};
