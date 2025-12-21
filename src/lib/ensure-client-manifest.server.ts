// Ensure a minimal clientReferenceManifest singleton exists on the server
// This is a guarded fallback to avoid Next.js throwing when the build
// does not populate client reference manifests correctly.
const sym = Symbol.for('next.server.action-manifests');

if (!globalThis[sym]) {
  // Populate a minimal structure. Keys are common route forms used by the app.
  globalThis[sym] = {
    clientReferenceManifestsPerPage: {
      '/': {
        clientModules: {},
        edgeRscModuleMapping: {},
        rscModuleMapping: {},
      },
      '/(app-shell)/page': {
        clientModules: {},
        edgeRscModuleMapping: {},
        rscModuleMapping: {},
      },
    },
    serverActionsManifest: {},
    serverModuleMap: {},
  };
}

export {};
