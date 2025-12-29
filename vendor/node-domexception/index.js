// Local shim that re-exports the native DOMException without pulling deprecated deps.
if (!globalThis.DOMException) {
  class DOMException extends Error {
    constructor(message = 'DOMException', name = 'DOMException') {
      super(message);
      this.name = name;
    }
  }
  globalThis.DOMException = DOMException;
}

module.exports = globalThis.DOMException;
