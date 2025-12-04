import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally for tests that rely on it being in scope
(globalThis as any).React = React;

// Minimal ResizeObserver polyfill for tests that render charting components
// which depend on a browser ResizeObserver (e.g., recharts).
(globalThis as any).ResizeObserver = class {
	constructor(_cb: any) {}
	observe() {}
	unobserve() {}
	disconnect() {}
};
