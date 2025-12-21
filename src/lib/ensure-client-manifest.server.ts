// Ensure a minimal clientReferenceManifest singleton exists on the server
// Provide a resilient fallback that returns an empty manifest for any route
// so Next's runtime can safely access client references during module eval.
const sym = Symbol.for('next.server.action-manifests');

if (!(globalThis as any)[sym]) {
  const emptyManifest = () => ({
    clientModules: {},
    edgeRscModuleMapping: {},
    rscModuleMapping: {},
  });

  const clientReferenceManifestsPerPage = new Proxy(Object.create(null), {
    get(_target, _prop) {
      return emptyManifest();
    },
    has() {
      return true;
    },
    ownKeys() {
      return [];
    },
    getOwnPropertyDescriptor() {
      return { configurable: true, enumerable: true, value: emptyManifest() };
    },
  });

  (globalThis as any)[sym] = {
    clientReferenceManifestsPerPage,
    serverActionsManifest: {},
    serverModuleMap: {},
  };
}

export {};
