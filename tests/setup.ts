import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Make React available globally for tests that rely on it being in scope
(globalThis as any).React = React;

// Ensure tests can run without a real Postgres password in dev/test environments.
// Some integration helpers in the repo allow a fallback when this env var is set.
process.env.DEV_ALLOW_DEFAULT_PG_PASSWORD = 'true';

// Provide a QueryClientProvider wrapper to all renders from @testing-library/react
// so hooks using react-query (useQuery) work in tests without each test having
// to wrap components manually.
import * as rtl from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

vi.mock('@testing-library/react', async () => {
	const actual = await vi.importActual<typeof rtl>('@testing-library/react');
	return {
		...actual,
		render: (ui: any, options?: any) => actual.render(
			React.createElement(QueryClientProvider, { client: testQueryClient }, ui),
			options
		),
	};
});

// Minimal ResizeObserver polyfill for tests that render charting components
// which depend on a browser ResizeObserver (e.g., recharts).
(globalThis as any).ResizeObserver = class {
	constructor(_cb: any) {}
	observe() {}
	unobserve() {}
	disconnect() {}
};
