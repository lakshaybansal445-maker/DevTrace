import json
import logging
from typing import Optional
from ..models.telemetry import (
    Trace,
    Span,
    DecisionIntelligenceNode,
    DecisionImpactMetrics,
    DecisionRecommendedPatch,
    DecisionSeverity,
)
from ..config import settings

logger = logging.getLogger(__name__)

def diagnose_trace_heuristically(trace: Trace) -> DecisionIntelligenceNode:
    """
    Kinetic diagnostic reasoning engine: analyzes span waterfall, error details,
    timings, queries, and attributes to synthesize an Architectural Decision Record.
    """
    adr_id = f"adr-{trace.id.replace('trace-', '')[:8]}"
    spans = trace.spans
    
    # 1. Check for database deadlocks
    deadlock_span = next(
        (s for s in spans if "deadlock" in (s.errorDetails or "").lower() or "40001" in (s.errorDetails or "") or "deadlock" in s.name.lower()),
        None
    )
    if deadlock_span:
        return DecisionIntelligenceNode(
            id=adr_id,
            title="Distributed Transaction Deadlock Elimination in Ledger Balances",
            severity="danger",
            service=trace.rootService,
            affectedTraceId=trace.id,
            timestamp="Just now",
            rootCause=f"Concurrent transactions acquire row locks in arbitrary order inside '{deadlock_span.service}'. PostgreSQL reported error 40001 serialization deadlock during '{deadlock_span.query or deadlock_span.name}'.",
            impactMetrics=DecisionImpactMetrics(
                errorRateChange="-100% Deadlock Rollbacks",
                throughputGain="+2.2x Transaction TPS",
                latencyReduction=f"-{int(deadlock_span.durationMs * 0.85)}ms p99",
            ),
            architecturalHypothesis="Enforce global deterministic locking order: sort all target entity IDs lexicographically before issuing SELECT ... FOR UPDATE. This converts cyclic lock dependency graphs into a strict DAG, preventing deadlocks.",
            recommendedPatch=DecisionRecommendedPatch(
                language="typescript",
                filePath="src/services/transactions/ledgerLockOrder.ts",
                codeSnippet="""// ❌ BEFORE: Arbitrary lock acquisition causes circular wait graph
for (const accountId of accountIds) {
  await client.query('SELECT balance FROM accounts WHERE id = $1 FOR UPDATE', [accountId]);
}

// ✅ AFTER (Kinetic Invariant): Enforce deterministic lock hierarchy
const sortedAccountIds = [...accountIds].sort();
for (const accountId of sortedAccountIds) {
  await client.query('SELECT balance FROM accounts WHERE id = $1 FOR UPDATE', [accountId]);
}""",
                explanation="Guarantees lock acquisitions follow a linear order across all distributed workers, making cyclic wait states mathematically impossible.",
            ),
            status="pending_review",
        )

    # 2. Check for connection pool exhaustion
    pool_span = next(
        (s for s in spans if "pool exhausted" in (s.errorDetails or "").lower() or "connection pool" in (s.name or "").lower() and s.status == "error"),
        None
    )
    if pool_span or trace.statusCode == 504:
        return DecisionIntelligenceNode(
            id=adr_id,
            title="Database Connection Starvation Mitigation via Ingestion Queue",
            severity="danger",
            service=trace.rootService,
            affectedTraceId=trace.id,
            timestamp="Just now",
            rootCause=f"Endpoint '{trace.rootEndpoint}' holds a synchronous relational connection socket during processing. High-concurrency traffic exhausted the database connection pool (timeout {trace.durationMs}ms).",
            impactMetrics=DecisionImpactMetrics(
                errorRateChange="-100% 504 Gateway Timeouts",
                latencyReduction=f"-{int(trace.durationMs - 25)}ms p95",
                costImpact="Eliminates immediate database vertical scale-up",
            ),
            architecturalHypothesis="Decouple synchronous HTTP request handling from database writes. Acknowledge payloads into a distributed message broker (Kafka/SQS) with an immediate HTTP 202 Accepted, and process database transactions via rate-controlled background workers.",
            recommendedPatch=DecisionRecommendedPatch(
                language="typescript",
                filePath="src/routes/webhooks/asyncIngestionHandler.ts",
                codeSnippet="""// ❌ BEFORE: Direct DB transaction blocks pool during payload processing
app.post('/webhook', async (req, res) => {
  const client = await dbPool.connect(); // Blocked until timeout!
  await client.query('INSERT INTO events VALUES ($1)', [req.body]);
  res.json({ ok: true });
});

// ✅ AFTER: Buffer events in event broker with sub-10ms ACK
app.post('/webhook', async (req, res) => {
  await eventBroker.produce({ topic: 'webhooks.ingest', value: req.body });
  return res.status(202).json({ received: true });
});""",
                explanation="Absorbs bursty webhook volume without exhausting backend database connection sockets.",
            ),
            status="pending_review",
        )

    # 3. Check for cache stampede / rate limit (429)
    stampede_span = next(
        (s for s in spans if s.statusCode == 429 or "rate limit" in (s.errorDetails or "").lower() or "429" in (s.errorDetails or "")),
        None
    )
    if stampede_span or trace.statusCode == 429:
        return DecisionIntelligenceNode(
            id=adr_id,
            title="JWKS Cache Stampede Protection with SingleFlight Request Coalescing",
            severity="danger",
            service=trace.rootService,
            affectedTraceId=trace.id,
            timestamp="Just now",
            rootCause=f"Cache miss on public key JWKS caused concurrent inbound requests to simultaneously fetch remote credentials from the upstream IdP, exceeding API rate limits (HTTP 429).",
            impactMetrics=DecisionImpactMetrics(
                errorRateChange="-100% 429 Throttling Errors",
                latencyReduction="-1200ms cold-start latency",
                throughputGain="+5x Concurrent Auth Capacity",
            ),
            architecturalHypothesis="Implement SingleFlight request coalescing and stale-while-revalidate caching. When the cache expires, only a single background flight queries the remote IdP while all other concurrent requests await that shared Promise.",
            recommendedPatch=DecisionRecommendedPatch(
                language="typescript",
                filePath="src/services/auth/jwksSingleFlight.ts",
                codeSnippet="""// ✅ Kinetic SingleFlight Invariant
const flightGroup = new Map<string, Promise<JwksKeySet>>();

export async function getJwksCoalesced(url: string): Promise<JwksKeySet> {
  const cached = await redis.get(url);
  if (cached) return JSON.parse(cached);

  if (flightGroup.has(url)) {
    return flightGroup.get(url)!; // Share identical in-flight promise!
  }

  const promise = fetchRemoteJwks(url).finally(() => flightGroup.delete(url));
  flightGroup.set(url, promise);
  return promise;
}""",
                explanation="Collapses hundreds of concurrent cache misses into exactly 1 remote request, eliminating rate-limiting cascades.",
            ),
            status="pending_review",
        )

    # 4. Check for N+1 SQL or sequential retrieval in vector/RAG pipelines
    n1_span = next(
        (s for s in spans if "n_plus_one" in s.name or "sequential" in (s.errorDetails or "").lower() or "hnsw" in s.name.lower()),
        None
    )
    if n1_span or "rag" in trace.tags or "vector" in trace.rootService:
        return DecisionIntelligenceNode(
            id=adr_id,
            title="Vector Rehydration N+1 Batching & Scalar Quantization Optimization",
            severity="warning",
            service=trace.rootService,
            affectedTraceId=trace.id,
            timestamp="Just now",
            rootCause="Vector search performs sequential individual database queries for each matched chunk. In addition, unquantized full FP32 vectors in the HNSW index induce excessive memory bandwidth overhead during nearest-neighbor traversal.",
            impactMetrics=DecisionImpactMetrics(
                latencyReduction="-480ms p95 (-60%)",
                throughputGain="+3.1x RPS",
                costImpact="-25% Memory Footprint",
            ),
            architecturalHypothesis="Consolidate document chunk fetches into a single batched ANY($1) SQL array query. Enable int8 scalar quantization on the Qdrant HNSW index to reduce distance computation latency from ~480ms down to ~35ms.",
            recommendedPatch=DecisionRecommendedPatch(
                language="typescript",
                filePath="src/services/vector/batchHydrator.ts",
                codeSnippet="""// ✅ Consolidated batch query with scalar quantized index
const matchIds = vectorResults.map(r => r.id);
const { rows } = await db.query(
  'SELECT id, payload, chunk_index FROM document_chunks WHERE id = ANY($1::uuid[])',
  [matchIds]
);
const docMap = new Map(rows.map(r => [r.id, r]));
return vectorResults.map(r => docMap.get(r.id)).filter(Boolean);""",
                explanation="Replaces N roundtrips with 1 optimized index scan, reducing database network roundtrips by 96%.",
            ),
            status="pending_review",
        )

    # 5. Generic high-latency / degraded fallback
    slowest_span = max(spans, key=lambda s: s.durationMs) if spans else None
    slow_service = slowest_span.service if slowest_span else trace.rootService
    slow_duration = slowest_span.durationMs if slowest_span else trace.durationMs

    return DecisionIntelligenceNode(
        id=adr_id,
        title=f"Latency Amplification Remediation in {slow_service.replace('-', ' ').title()}",
        severity="recommendation" if trace.status == "nominal" else "warning",
        service=slow_service,
        affectedTraceId=trace.id,
        timestamp="Just now",
        rootCause=f"Bottleneck span '{slowest_span.name if slowest_span else trace.rootEndpoint}' consumed {slow_duration}ms ({int((slow_duration / max(trace.durationMs, 1)) * 100)}% of total trace runtime).",
        impactMetrics=DecisionImpactMetrics(
            latencyReduction=f"-{int(slow_duration * 0.6)}ms estimated",
            throughputGain="+1.8x RPS",
        ),
        architecturalHypothesis=f"Introduce asynchronous pipelining and an in-memory caching tier in {slow_service} to bypass redundant downstream network hops.",
        recommendedPatch=DecisionRecommendedPatch(
            language="typescript",
            filePath=f"src/services/{slow_service}/cacheOptimization.ts",
            codeSnippet=f"""// ✅ Apply localized caching to bypass downstream latency
const cacheKey = `{slow_service}:${{requestId}}`;
const cachedResponse = await localCache.get(cacheKey);
if (cachedResponse) return cachedResponse;

const result = await executeHeavyOperation();
await localCache.set(cacheKey, result, {{ ttl: 60 }});
return result;""",
            explanation=f"Short-circuits execution path for {slow_service}, avoiding repeated {slow_duration}ms roundtrips.",
        ),
        status="pending_review",
    )


async def query_open_weight_model(prompt: str) -> Optional[dict]:
    """
    Query open-weight model (e.g. Gemma 4) via local Ollama or OpenAI-compatible vLLM/endpoint.
    """
    import httpx
    base_url = settings.OPEN_WEIGHT_API_URL.rstrip("/")
    headers = {"Content-Type": "application/json"}
    if settings.OPEN_WEIGHT_API_KEY:
        headers["Authorization"] = f"Bearer {settings.OPEN_WEIGHT_API_KEY}"

    async with httpx.AsyncClient(timeout=settings.OPEN_WEIGHT_TIMEOUT_SECONDS) as client:
        # Try Ollama native API (/api/chat)
        try:
            ollama_payload = {
                "model": settings.OPEN_WEIGHT_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert distributed systems architect for DevTrace Kinetic Intelligence. Output strictly valid raw JSON without markdown ticks.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
                "format": "json",
            }
            res = await client.post(f"{base_url}/api/chat", json=ollama_payload, headers=headers)
            if res.status_code == 200:
                raw_text = res.json().get("message", {}).get("content", "").strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("\n", 1)[1]
                    if raw_text.endswith("```"):
                        raw_text = raw_text.rsplit("\n", 1)[0]
                return json.loads(raw_text)
        except Exception as e:
            logger.debug(f"Ollama chat endpoint attempt: {e}")

        # Try /v1/chat/completions (vLLM / HuggingFace / OpenAI-compatible endpoint)
        try:
            v1_payload = {
                "model": settings.OPEN_WEIGHT_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert distributed systems architect for DevTrace Kinetic Intelligence. Output strictly valid raw JSON without markdown ticks.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "response_format": {"type": "json_object"},
            }
            res = await client.post(f"{base_url}/v1/chat/completions", json=v1_payload, headers=headers)
            if res.status_code == 200:
                raw_text = res.json()["choices"][0]["message"]["content"].strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("\n", 1)[1]
                    if raw_text.endswith("```"):
                        raw_text = raw_text.rsplit("\n", 1)[0]
                return json.loads(raw_text)
        except Exception as e:
            logger.debug(f"v1 chat completions endpoint attempt: {e}")

    return None


async def analyze_trace_with_open_weight_or_heuristic(
    trace: Trace,
    use_ai: bool = True
) -> DecisionIntelligenceNode:
    """
    Analyzes a trace using open-weight models (like Gemma 4 via Ollama);
    falls back gracefully and immediately to kinetic heuristic diagnostic rules.
    """
    if not use_ai:
        return diagnose_trace_heuristically(trace)

    prompt = f"""
Analyze this distributed trace waterfall and provide an actionable Architectural Decision Record (ADR).

Trace Details:
- ID: {trace.id}
- Root Endpoint: {trace.httpMethod} {trace.rootEndpoint}
- Root Service: {trace.rootService}
- Total Duration: {trace.durationMs}ms
- Status Code: {trace.statusCode}
- Overall Status: {trace.status}
- Spans:
{json.dumps([s.model_dump() for s in trace.spans], indent=2)}

Respond with a JSON object strictly following this structure:
{{
  "title": "<Concise engineering title>",
  "severity": "<danger | warning | recommendation | success>",
  "service": "<affected service name>",
  "rootCause": "<Deep technical explanation of the root cause>",
  "impactMetrics": {{
    "latencyReduction": "<e.g. -340ms p95>",
    "errorRateChange": "<e.g. -100% 500 Errors>",
    "throughputGain": "<e.g. +2.4x RPS>",
    "costImpact": "<e.g. -20% CPU utilization>"
  }},
  "architecturalHypothesis": "<Clear hypothesis explaining how the architectural refactoring resolves the issue>",
  "recommendedPatch": {{
    "language": "<typescript or python>",
    "filePath": "<realistic file path in repo>",
    "codeSnippet": "<concrete before/after or refactored code>",
    "explanation": "<why this code resolves the structural bottleneck>"
  }}
}}
Return ONLY the raw JSON object, without markdown ticks.
"""

    try:
        parsed = await query_open_weight_model(prompt)
        if parsed and isinstance(parsed, dict) and "title" in parsed:
            return DecisionIntelligenceNode(
                id=f"adr-{trace.id.replace('trace-', '')[:8]}",
                title=parsed.get("title", f"Architectural Refactoring for {trace.rootService}"),
                severity=parsed.get("severity", "danger" if trace.status in ["critical", "error"] else "warning"),
                service=parsed.get("service", trace.rootService),
                affectedTraceId=trace.id,
                timestamp="Just now",
                rootCause=parsed.get("rootCause", "Identified latency amplification in distributed span path."),
                impactMetrics=DecisionImpactMetrics(
                    latencyReduction=parsed.get("impactMetrics", {}).get("latencyReduction"),
                    errorRateChange=parsed.get("impactMetrics", {}).get("errorRateChange"),
                    throughputGain=parsed.get("impactMetrics", {}).get("throughputGain"),
                    costImpact=parsed.get("impactMetrics", {}).get("costImpact"),
                ),
                architecturalHypothesis=parsed.get("architecturalHypothesis", "Refactoring query/execution architecture eliminates bottleneck."),
                recommendedPatch=DecisionRecommendedPatch(
                    language=parsed.get("recommendedPatch", {}).get("language", "typescript"),
                    filePath=parsed.get("recommendedPatch", {}).get("filePath", "src/services/handler.ts"),
                    codeSnippet=parsed.get("recommendedPatch", {}).get("codeSnippet", "// Refactored execution path"),
                    explanation=parsed.get("recommendedPatch", {}).get("explanation", "Eliminates redundant roundtrips."),
                ),
                status="pending_review",
            )
    except Exception as e:
        logger.info(f"Open-weight model inference unavailable ({e}). Employing kinetic diagnostic heuristics.")

    return diagnose_trace_heuristically(trace)
