// Small client-side noop module used to avoid bundling server-only OpenTelemetry packages.
const emptyClient = {};
export default emptyClient;
export const noop = () => {};
