## Local Observability Stack

This directory runs a local LGTM-style stack for Radiant:

- `Grafana` on `http://localhost:3001`
- `Alloy` OTLP receiver on `http://localhost:4318` and `grpc://localhost:4317`
- `Prometheus` on `http://localhost:9090`
- `Loki` on `http://localhost:3100`
- `Tempo` on `http://localhost:3200`

### Start

```bash
bun run obs:up
```

### Stop

```bash
bun run obs:down
```

### Inspect

```bash
bun run obs:ps
bun run obs:logs
```

### What Radiant sends

The backend is configured to send OTLP telemetry to Alloy with:

- `RADIANT_OTEL_BASE_URL=http://localhost:4318`

This points to `Alloy`, not directly to `Grafana`.

`Grafana` is only the UI where you explore the data after Alloy forwards it.

Alloy then forwards:

- traces -> Tempo
- logs -> Loki
- metrics -> Prometheus remote write receiver

### How to use Grafana

1. Open `http://localhost:3001`
2. Sign in with `admin` / `admin`
3. Grafana will ask you to change the password on first login
4. Go to `Explore`
5. Choose a datasource:
   - `Tempo` for traces
   - `Loki` for logs
   - `Prometheus` for metrics

### Provisioned Dashboards

Grafana now provisions a `Radiant` folder with:

- `Radiant Overview`
- `Radiant Logs`
- `Radiant Traces`

These are a faster starting point than building everything manually in `Explore`.

### Good first checks

#### Traces

- In `Explore`, pick `Tempo`
- Search for spans like:
  - `RadioStream.startRadio`
  - `PlayoutManager.syncNow`
  - `RadioManager.getStream`
  - `radio.listen`

#### Logs

- In `Explore`, pick `Loki`
- Search for:
  - `radio_stream.starting`
  - `playout.sync_now`
  - `radio.listen.connected`

#### Metrics

- In `Explore`, pick `Prometheus`
- Try:
  - `radio_starts_total`
  - `radio_stream_clones_total`
  - `radio_listener_connections_total`
  - `radio_listener_connections_active`
  - `radio_playout_syncs_total`
  - `radio_multiplexer_set_cluster_total`

### Notes

- This is a local dev stack, not production-grade.
- If you need auth headers for a remote collector later, use `RADIANT_OTEL_HEADERS`.
