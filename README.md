# DevTrace · Kinetic Distributed Intelligence & Live Telemetry

> **Real-time distributed tracing, open-weight AI root-cause diagnosis, live GitHub CI/CD integration, and automated architectural refactoring.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-OTLP%20v1.2-F5A800?style=flat&logo=opentelemetry)](https://opentelemetry.io)
[![Gemma 4](https://img.shields.io/badge/AI-Gemma%204%20(Open--Weight)-4285F4?style=flat)](https://github.com/google/gemma_pytorch)

---

## 🌟 Overview

**DevTrace** bridges the gap between observability and code remediation. Instead of leaving engineers with static graphs and opaque stack traces, DevTrace:
1. Ingests live distributed traces across microservices in real time via **OpenTelemetry**.
2. Automatically diagnoses complex architectural failures (e.g. database serialization deadlocks, RAG vector search bottlenecks, connection pool starvation) using **local open-weight models (Gemma 4)** with zero external cloud API dependencies.
3. Produces ready-to-merge, syntax-highlighted **code patches** and architectural decisions.
4. Connects directly to **Live GitHub Repositories** to ingest real git commits, authors, and GitHub Actions CI/CD workflows.

---

## 🚀 Quick Start (1-Click Run)

### Option 1: Run Both Backend & Frontend Together (Recommended)
You can launch both the **FastAPI Python backend** (`:8000`) and the **Vite React frontend** (`:5173`) with a single command:

```bash
# Using npm
npm run dev:all

# OR using Python directly
python run_all.py

# OR on Windows, simply double-click:
start.bat
```

Once running:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **FastAPI Interactive Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Backend Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Option 2: Run Individually in Separate Terminals

#### 1. Python Backend
Prerequisites: Python 3.11+

```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Start backend server
python backend/run_server.py
```

#### 2. Frontend React Application
Prerequisites: Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

---

## 🧠 Open-Weight AI Architecture (Gemma 4 via Ollama)

DevTrace uses **Google's open-weight Gemma 4 model** running locally via Ollama (`http://localhost:11434`) without requiring any paid or closed proprietary APIs.

- **Configured Model:** `gemma4:latest` (or `gemma2:latest`, `llama3.2`, etc.)
- **Local Host:** `http://localhost:11434/api/generate`
- **Zero-Latency Kinetic Fallback:** Built-in heuristic analyzer guarantees instant diagnosis (<1ms) if Ollama is performing a cold-start or offline.
- **Customization:** Modify model preferences in [`backend/app/config.py`](backend/app/config.py) or set `OLLAMA_MODEL=gemma4:latest` in your environment.

---

## ⚡ Core Features

### 1. 📊 Live Network Requests & Distributed Tracing
- Full OpenTelemetry span ingestion with HTTP methods, endpoints, status codes, and microservice call hierarchies.
- **Request Speed Visualizer:** Visual scatter timeline classifying requests into Fast (`<250ms`), Slow (`>500ms`), and Critical Errors.
- **Waterfall Inspector Drawer:** Step-by-step span duration breakdown with database query inspection and plain-English diagnosis summaries.

### 2. 🤖 AI Code Fixes & Architecture Decisions (ADRs)
- Automatic root-cause isolation identifying exact code bottlenecks.
- Side-by-side **code patches** showing proposed refactorings.
- One-click **"Apply Code Fix"** button that promotes fixes to active cluster invariants.
- Track estimated performance improvements (e.g. `-800ms Net Latency Saved`, `+1.8x Throughput`).

### 3. 🐙 Live GitHub Actions & CI/CD Telemetry
- **Live GitHub REST API v3 / Actions Integration:** Connects directly to public GitHub repositories (e.g. `facebook/react`, `vercel/next.js`, `fastapi/fastapi`, `torvalds/linux`, `tailwindlabs/tailwindcss`, `microsoft/vscode`).
- **Rich Telemetry Ingestion:** Fetches real star counts (⭐), forks (⑂), active branch, author names, commit SHAs, and live GitHub Actions workflow runs.
- **Workflow & Commit Fallback:** Automatically parses actual GitHub Actions workflow runs (`checkout`, `test-matrix`, `build-packaging`); seamlessly falls back to real live git commit histories for repositories without public Actions logs.

### 4. 🗺️ Dynamic Service Health Map
- Automatically calculates microservice dependency graph from ingested spans.
- Shows live RPS throughput, P95 latency, and error rate percentages per microservice.
- Interactive service health toggler (Nominal, Degraded, Critical).

### 5. 🎯 System Reliability Goals (SLOs)
- Track Service Level Objectives across API Latency, Checkout Availability, and Queue Lag.
- Live error budget burn-rate calculations based on real-time sliding windows.

---

## 🧪 Testing with Real-Life Scenarios

DevTrace includes a comprehensive suite of real-world production microservice failure scenarios:

### 1. Run Automated Test Suite (10/10 Verification)
Verify all API endpoints, OpenTelemetry ingestion, scenario triggers, and health checks:
```bash
python backend/examples/test_suite.py
```

### 2. Inject Real-Life Production Scenarios via CLI
```bash
# Ingest all production scenarios sequentially
python backend/examples/simulate_real_traffic.py --all

# Test PostgreSQL circular deadlock code 40001 during checkout
python backend/examples/simulate_real_traffic.py --scenario ecommerce_checkout_deadlock

# Test LLM RAG vector search & unbatched N+1 SQL queries (1,020ms)
python backend/examples/simulate_real_traffic.py --scenario llm_rag_vector_bottleneck

# Test Stripe webhook burst exhausting DB connection pool (504 Timeout)
python backend/examples/simulate_real_traffic.py --scenario stripe_webhook_connection_starvation

# Test Auth Gateway JWKS cache stampede (Okta 429 Rate Limit)
python backend/examples/simulate_real_traffic.py --scenario auth_jwt_cache_stampede

# Test Kafka consumer lag spike during event rebalancing
python backend/examples/simulate_real_traffic.py --scenario kafka_consumer_lag_spike

# Test Healthy fast-path baseline (18ms)
python backend/examples/simulate_real_traffic.py --scenario nominal_fastpath
```

### 3. Continuous Traffic Simulator (Live Demo Mode)
Stream a constant flow of realistic traffic into DevTrace:
```bash
python backend/examples/simulate_real_traffic.py --continuous --interval 2.0
```

### 4. Real OpenTelemetry SDK Application
Demonstrates instrumenting a Python service using official `opentelemetry-sdk` to push traces directly into DevTrace:
```bash
python backend/examples/otel_instrumented_app.py
```

---

## 📂 Project Structure

```
hackathon/
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI REST Routers
│   │   │   ├── routes_traces.py     # Ingestion & simulation endpoints
│   │   │   ├── routes_decisions.py  # AI code patches & ADR governance
│   │   │   ├── routes_gitlab.py     # GitLab official GraphQL API integration
│   │   │   ├── routes_github.py     # Live GitHub repository & CI/CD API
│   │   │   ├── routes_mesh.py       # Dynamic service dependency graph
│   │   │   ├── routes_pipelines.py  # CI/CD pipeline telemetry
│   │   │   ├── routes_slos.py       # Error budget burn-rates
│   │   │   ├── routes_stream.py     # Server-Sent Events (SSE) live bus
│   │   │   └── routes_system.py     # System health & metrics
│   │   ├── engine/               # Diagnostics & Analysis
│   │   │   ├── analyzer.py          # Gemma 4 Ollama caller + kinetic heuristics
│   │   │   └── scenario_gen.py      # Real-life failure scenarios generator
│   │   ├── models/               # Pydantic v2 telemetry schemas
│   │   │   └── telemetry.py
│   │   ├── storage/              # Thread-safe in-memory telemetry repository
│   │   │   └── repository.py
│   │   ├── config.py             # App & Ollama settings
│   │   └── main.py               # FastAPI application entrypoint
│   ├── examples/                 # Verification & simulation CLI tools
│   │   ├── test_suite.py            # Automated 10-step integration tests
│   │   ├── simulate_real_traffic.py # Scenario injector & traffic streamer
│   │   └── otel_instrumented_app.py # Native OpenTelemetry Python SDK sample
│   ├── requirements.txt          # Python dependencies
│   └── run_server.py             # Uvicorn server launcher (:8000)
├── src/                          # React + TypeScript Frontend
│   ├── components/
│   │   ├── common/               # SimulateTraceModal & shared widgets
│   │   ├── decision/             # AI Code Fixes & Decision Intelligence View
│   │   ├── governance/           # SLO Governance View
│   │   ├── layout/               # Header, Sidebar, CommandPalette
│   │   ├── mesh/                 # Service Topology Mesh View
│   │   ├── pipelines/            # Live GitLab (GraphQL) & GitHub Telemetry View
│   │   └── traces/               # Trace Explorer View & Inspector Drawer
│   ├── data/                     # Initial seed telemetry data
│   ├── services/                 # API client with SSE & GraphQL integration
│   ├── types/                    # TypeScript interfaces for telemetry
│   ├── App.tsx                   # Main React Application
│   └── index.css                 # Design system & styling tokens
├── run_all.py                    # 1-Click Unified Runner (Backend + Frontend)
├── start.bat                     # Windows batch launcher
├── vite.config.ts                # Vite config with backend proxy (:8000)
└── package.json                  # Frontend scripts & dependencies
```

---

## 🛠️ API Reference Summary

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | System health, uptime, stored traces, active AI model |
| `/api/traces` | `GET` | List ingested traces with duration, spans, and statuses |
| `/api/traces/simulate` | `POST` | Ingest a custom distributed trace |
| `/api/traces/scenario/{id}` | `POST` | Inject a real-life failure scenario |
| `/api/decisions` | `GET` | List architectural diagnoses & proposed code patches |
| `/api/decisions/{id}/apply` | `POST` | Apply code fix to cluster invariant |
| `/api/github/pipeline?repo={r}` | `GET` | Fetch live GitHub repository commits & Actions workflow runs |
| `/api/github/repos?user={u}` | `GET` | Search or list public GitHub repositories |
| `/api/mesh` | `GET` | Dynamic service topology, error rates, and RPS |
| `/api/slos` | `GET` | Error budget consumption & SLO compliance |
| `/api/stream` | `GET` | Server-Sent Events (SSE) live telemetry stream |

---

## 📄 License

MIT License. Built for engineering teams that value high-velocity microservice reliability and automated code remediation.
