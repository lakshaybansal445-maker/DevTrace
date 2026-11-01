# DevTrace Kinetic Intelligence - Python Backend

High-performance Python backend built with **FastAPI**, **Pydantic v2**, and **OpenTelemetry SDK** for distributed tracing, real-time telemetry streaming, and Architecture Decision Intelligence.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Start the Backend Server
```bash
python backend/run_server.py
```
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 🧪 Testing with Real-Life Examples

### Option A: Run the Automated Integration Test Suite
Executes a 10-point test suite validating all endpoints and real-life scenarios:
```bash
python backend/examples/test_suite.py
```

### Option B: Ingest Real-Life Production Failure Scenarios
Test realistic microservice failure topologies with immediate AI root-cause diagnosis:

```bash
# 1. Run all 6 real-life scenarios sequentially
python backend/examples/simulate_real_traffic.py --all

# 2. Test PostgreSQL 40001 serialization deadlock in e-commerce checkout
python backend/examples/simulate_real_traffic.py --scenario ecommerce_checkout_deadlock

# 3. Test LLM RAG vector search & N+1 SQL metadata rehydration bottleneck
python backend/examples/simulate_real_traffic.py --scenario llm_rag_vector_bottleneck

# 4. Test Auth Gateway JWKS cache stampede (Okta 429 rate limit cascade)
python backend/examples/simulate_real_traffic.py --scenario auth_jwt_cache_stampede

# 5. Test Stripe webhook traffic spike exhausting DB connection pool (504 timeout)
python backend/examples/simulate_real_traffic.py --scenario stripe_webhook_connection_starvation

# 6. Test Kafka partition skew and consumer lag accumulation
python backend/examples/simulate_real_traffic.py --scenario kafka_consumer_lag_spike

# 7. Test Sub-20ms cached fast-path baseline
python backend/examples/simulate_real_traffic.py --scenario nominal_fastpath
```

### Option C: Stream Continuous Live Production Traffic
Simulates steady background traffic with periodic realistic fault spikes:
```bash
python backend/examples/simulate_real_traffic.py --continuous --interval 1.5
```

### Option D: Real OpenTelemetry SDK Instrumentation Example
Demonstrates how any external Python application instruments code with standard OpenTelemetry and pushes traces into DevTrace:
```bash
python backend/examples/otel_instrumented_app.py
```

---

## 🔌 API Endpoints Reference

### Distributed Traces
- `GET /api/traces` - Filter traces by `service`, `status`, `environment`, `region`, `search`, `limit`
- `GET /api/traces/{trace_id}` - Retrieve full trace waterfall with parent-child span tree
- `POST /api/traces` - Ingest custom or OpenTelemetry trace payload
- `POST /api/traces/simulate` - Simulate customizable trace with injected faults
- `POST /api/traces/scenario/{scenario_name}` - Ingest one of the 6 real-world scenarios

### Architecture Decision Intelligence (ADRs)
- `GET /api/decisions` - List all Architectural Decision Records
- `POST /api/decisions/analyze` - Run Kinetic AI Diagnosis on any trace to identify root cause, impact metrics, and code patch
- `POST /api/decisions` - Draft custom ADR
- `PATCH /api/decisions/{id}` - Update status (`applied`, `dismissed`, `pending_review`)

### Dynamic Service Mesh
- `GET /api/mesh/services` - Service topology, health scores, RPS, and p99 latencies dynamically recalculated from ingested traces
- `PATCH /api/mesh/services/{service_id}/health` - Adjust service health score

### CI/CD Pipelines
- `GET /api/pipelines` - List hermetic pipeline runs and telemetry
- `POST /api/pipelines/trigger` - Trigger a canary pipeline run with simulated regression option

### SLO Governance
- `GET /api/slos` - List Service Level Objectives, error budgets, and burn rate ratios
- `POST /api/slos/audit` - Audit and recalculate error budgets against current trace window

### Real-Time Streaming & System
- `GET /api/stream` - Server-Sent Events (SSE) live telemetry stream
- `GET /api/health` - Backend health status and diagnostic info
- `GET /api/scenarios` - Available real-world scenario metadata
- `POST /api/seed` - Reset telemetry database to clean baseline dataset

---

## 🧠 Architecture Decision Intelligence

The backend implements dual-tier decision intelligence using **Open-Weight Models only**:
1. **Open-Weight Model Engine (Default: Gemma 4 via Ollama)**: Queries local or private open-weight models (like `gemma4:latest` at `http://localhost:11434` or custom vLLM / Hugging Face endpoint) for natural-language contextual architectural diagnosis and patch generation.
2. **Kinetic Diagnostic Engine (Built-in Invariant Engine)**: Instant heuristic rule engine that detects distributed deadlocks (PG 40001), N+1 query loops, connection pool exhaustion (504), cache stampedes (429), and HNSW unquantized search bottlenecks with zero network overhead.
