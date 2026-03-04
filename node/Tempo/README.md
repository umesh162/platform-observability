# Trace Demo (Node.js + Express + OTEL + Collector + Tempo + Grafana)

Minimal end-to-end tracing demo:
- Node.js app (`app.js`) emits traces via OpenTelemetry (`tracing.js`)
- OTEL Collector receives traces and forwards to Tempo
- Grafana is pre-provisioned with a Tempo data source

## Prerequisites

- Docker + Docker Compose plugin (`docker-compose`)
- Node.js 18+ and npm

## Run the project

From this directory:

```bash
# 1) Start observability stack
docker-compose up -d

# 2) Install app dependencies
npm install

# 3) Start app with OTEL env
export PORT=8080
export OTEL_SERVICE_NAME=demo-node-express
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
export OTEL_TRACES_SAMPLER=parentbased_traceidratio
export OTEL_TRACES_SAMPLER_ARG=1.0
export OTEL_PROPAGATORS=tracecontext,baggage
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=demo,service.version=0.1.0
npm start
```

Expected app logs:
- `[otel] tracing initialized -> http://127.0.0.1:4318/v1/traces`
- `[app] listening on http://localhost:8080`

## Generate traces

Open a second terminal and run:

```bash
curl -s http://localhost:8080/ping
for i in {1..20}; do curl -s http://localhost:8080/simulate-work >/dev/null; done
```

Optional collector logs:

```bash
docker-compose logs --tail=100 otel-collector
```

## View traces in Grafana

1. Open `http://localhost:3000`
2. Login with `admin / admin`
3. Go to **Explore**
4. Choose data source **Tempo**
5. Set time range to last 15 minutes
6. Query by `service.name="demo-node-express"`
7. Open a trace and confirm `GET /simulate-work` plus child `/ping` spans

## Useful commands

```bash
# Check running containers
docker-compose ps

# Syntax check Node files
npm run check

# Stop stack
docker-compose down

# Stop stack and delete persisted data
docker-compose down -v
```

## Troubleshooting

- No traces in Grafana:
  - Ensure app env has `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318`
  - Verify stack is healthy with `docker-compose ps`
  - Check collector logs for export errors
- Service missing in Tempo search:
  - Confirm `OTEL_SERVICE_NAME=demo-node-express` is set before starting app
- Too few traces:
  - Keep `OTEL_TRACES_SAMPLER_ARG=1.0` for demo traffic
