class JaegerExporter {
  export(_spans, resultCallback) {
    if (typeof resultCallback === 'function') {
      resultCallback({ code: 0 });
    }
  }

  shutdown() {
    return Promise.resolve();
  }

  forceFlush() {
    return Promise.resolve();
  }
}

module.exports = { JaegerExporter };
