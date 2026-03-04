'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

if (process.env.OTEL_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const baseEndpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://127.0.0.1:4318').replace(/\/$/, '');
const tracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || `${baseEndpoint}/v1/traces`;

const traceExporter = new OTLPTraceExporter({
  url: tracesEndpoint
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

const onStarted = () => {
  // Keep startup logging explicit so demo troubleshooting is straightforward.
  console.log(`[otel] tracing initialized -> ${tracesEndpoint}`);
};

const onStartFailed = (error) => {
  console.error('[otel] failed to initialize tracing', error);
};

try {
  const startResult = sdk.start();
  if (startResult && typeof startResult.then === 'function') {
    startResult.then(onStarted).catch(onStartFailed);
  } else {
    onStarted();
  }
} catch (error) {
  onStartFailed(error);
}

const shutdown = (signal) => {
  const onShutdownComplete = () => {
    console.log(`[otel] tracing shutdown complete (${signal})`);
    process.exit(0);
  };

  const onShutdownFailed = (error) => {
    console.error('[otel] tracing shutdown failed', error);
    process.exit(1);
  };

  try {
    const shutdownResult = sdk.shutdown();
    if (shutdownResult && typeof shutdownResult.then === 'function') {
      shutdownResult.then(onShutdownComplete).catch(onShutdownFailed);
    } else {
      onShutdownComplete();
    }
  } catch (error) {
    onShutdownFailed(error);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
