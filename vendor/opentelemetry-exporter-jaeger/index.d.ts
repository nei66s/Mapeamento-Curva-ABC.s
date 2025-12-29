export class JaegerExporter {
  export(spans: unknown, resultCallback?: (result: { code: number }) => void): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}
