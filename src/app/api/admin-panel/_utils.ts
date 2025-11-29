import { NextResponse } from 'next/server';
import { featureModules } from './_data';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function parsePagination(searchParams: URLSearchParams, defaultSize = 20) {
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || defaultSize);
  return {
    page: page > 0 ? page : 1,
    pageSize: pageSize > 0 ? pageSize : defaultSize,
  };
}

export function isModuleActive(moduleId: string) {
  const mod = featureModules.find((m) => m.id === moduleId);
  return !mod || mod.active;
}

export function buildActiveModulesMap() {
  return Object.fromEntries(featureModules.map((m) => [m.id, Boolean(m.active) && m.visibleInMenu !== false]));
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  return forwarded || request.headers.get('x-real-ip') || '0.0.0.0';
}
