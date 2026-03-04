'use strict';

require('./tracing');

const express = require('express');
const http = require('node:http');
const { trace } = require('@opentelemetry/api');

const app = express();
const port = Number(process.env.PORT || 8080);

function callPingRoute() {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: 'localhost',
        port,
        path: '/ping',
        method: 'GET'
      },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode || 0));
      }
    );

    request.on('error', reject);
    request.end();
  });
}

app.get('/ping', (req, res) => {
  res.json({
    ok: true,
    route: '/ping',
    timestamp: new Date().toISOString()
  });
});

app.get('/simulate-work', async (req, res) => {
  const delayMs = Math.floor(Math.random() * 151) + 50;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  let downstreamStatus;
  try {
    downstreamStatus = await callPingRoute();
  } catch (error) {
    downstreamStatus = `error: ${error.message}`;
  }

  const activeSpan = trace.getActiveSpan();
  const traceId = activeSpan ? activeSpan.spanContext().traceId : 'unavailable';

  res.json({
    ok: true,
    route: '/simulate-work',
    delayMs,
    downstreamStatus,
    traceId
  });
});

app.listen(port, () => {
  console.log(`[app] listening on http://localhost:${port}`);
});
