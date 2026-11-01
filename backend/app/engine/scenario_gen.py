import uuid
import datetime
from typing import Dict, Any
from ..models.telemetry import Trace, Span, HttpMethod, Environment, Region

SCENARIO_METADATA = {
    "ecommerce_checkout_deadlock": {
        "title": "E-Commerce Checkout Deadlock (PostgreSQL 40001)",
        "description": "High-concurrency order settlement inducing cross-transaction cyclic row locks in PostgreSQL under SERIALIZABLE isolation, causing transaction rollbacks.",
        "severity": "critical",
        "service": "order-orchestrator",
    },
    "llm_rag_vector_bottleneck": {
        "title": "LLM RAG Vector Search & Rehydration Bottleneck",
        "description": "Unindexed HNSW search parameters combined with sequential N+1 SQL queries rehydrating document metadata, spiking p99 latency to nearly 1 second.",
        "severity": "degraded",
        "service": "vector-inference-engine",
    },
    "auth_jwt_cache_stampede": {
        "title": "Auth Gateway JWKS Cache Stampede (Okta 429)",
        "description": "Cold cache key expiry on JWKS public keys causing 600 concurrent outbound requests to Okta IdP, triggering HTTP 429 rate limit cascade.",
        "severity": "error",
        "service": "auth-gateway",
    },
    "stripe_webhook_connection_starvation": {
        "title": "Payment Webhook Flood & DB Connection Starvation",
        "description": "Burst of synchronous payment webhook deliveries holding PostgreSQL connection pool sockets during HTTP processing, exhausting the 100-connection limit.",
        "severity": "critical",
        "service": "payment-router",
    },
    "kafka_consumer_lag_spike": {
        "title": "Kafka Partition Skew & Consumer Lag Accumulation",
        "description": "Uneven message distribution across Kafka partitions starving consumer workers and accumulating 14,000 unread records in dead-letter queues.",
        "severity": "degraded",
        "service": "event-broker",
    },
    "nominal_fastpath": {
        "title": "Nominal Production Fast-Path (Healthy Baseline)",
        "description": "Sub-20ms sub-millisecond cached catalog lookup serving live traffic with zero error rate and 100% cache hit ratio.",
        "severity": "nominal",
        "service": "order-orchestrator",
    },
}

def generate_scenario_trace(
    scenario_type: str,
    environment: Environment = "production",
    region: Region = "us-east-1"
) -> Trace:
    trace_uid = str(uuid.uuid4())[:8]
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if scenario_type == "ecommerce_checkout_deadlock":
        trace_id = f"trace-dlk-{trace_uid}"
        root_span_id = f"span-{trace_id}-root"
        spans = [
            Span(
                id=root_span_id,
                name="POST /v2/orders/settle-cart",
                service="order-orchestrator",
                durationMs=2450.8,
                offsetMs=0.0,
                status="error",
                statusCode=500,
                kind="SERVER",
                attributes={
                    "http.target": "/v2/orders/settle-cart",
                    "http.method": "POST",
                    "http.status_code": 500,
                    "order.cart_id": f"cart_{trace_uid}",
                    "order.total_cents": 14950,
                    "concurrency.simulated_workers": 64,
                },
                errorDetails="TransactionAborted: serialization failure 40001 - deadlock detected",
            ),
            Span(
                id=f"span-{trace_id}-auth",
                parentId=root_span_id,
                name="auth.verify_session",
                service="auth-gateway",
                durationMs=18.5,
                offsetMs=1.2,
                status="ok",
                statusCode=200,
                kind="CLIENT",
                attributes={"auth.user_id": f"usr_{trace_uid}", "jwt.cached": True},
            ),
            Span(
                id=f"span-{trace_id}-inv",
                parentId=root_span_id,
                name="inventory.check_stock_levels",
                service="order-orchestrator",
                durationMs=34.2,
                offsetMs=22.0,
                status="ok",
                kind="INTERNAL",
                attributes={"sku.count": 3, "inventory.reserved": True},
            ),
            Span(
                id=f"span-{trace_id}-tx",
                parentId=root_span_id,
                name="postgres.execute_transfer_atomic",
                service="postgres-primary",
                durationMs=2350.0,
                offsetMs=62.0,
                status="error",
                kind="CLIENT",
                query="SELECT id, balance FROM ledger_balances WHERE account_id = $1 FOR UPDATE;",
                attributes={
                    "db.system": "postgresql",
                    "db.isolation": "SERIALIZABLE",
                    "db.deadlock_victim": True,
                    "db.lock_wait_ms": 2340.5,
                },
                errorDetails="ERROR: deadlock detected. Process 14201 waits for ExclusiveLock on tuple (42, 9) of relation 16385 'ledger_balances'; blocked by process 14298.",
            ),
            Span(
                id=f"span-{trace_id}-dlq",
                parentId=root_span_id,
                name="kafka.produce_order_rollback_event",
                service="event-broker",
                durationMs=16.8,
                offsetMs=2420.0,
                status="ok",
                kind="PRODUCER",
                attributes={"messaging.destination": "events.orders.failed", "order.retry_scheduled": True},
            ),
        ]
        return Trace(
            id=trace_id,
            rootEndpoint="/v2/orders/settle-cart",
            httpMethod="POST",
            rootService="order-orchestrator",
            durationMs=2450.8,
            timestamp=now_iso,
            relativeTime="Just now",
            statusCode=500,
            status="critical",
            spanCount=len(spans),
            errorCount=2,
            clientIp="198.51.100.82",
            environment=environment,
            region=region,
            spans=spans,
            tags=["checkout", "deadlock-40001", "high-concurrency", "postgres-lock"],
        )

    elif scenario_type == "llm_rag_vector_bottleneck":
        trace_id = f"trace-rag-{trace_uid}"
        root_span_id = f"span-{trace_id}-root"
        spans = [
            Span(
                id=root_span_id,
                name="POST /v1/vector/retrieve-context",
                service="vector-inference-engine",
                durationMs=982.4,
                offsetMs=0.0,
                status="warn",
                statusCode=200,
                kind="SERVER",
                attributes={
                    "http.target": "/v1/vector/retrieve-context",
                    "rag.query_length": 142,
                    "rag.top_k": 30,
                },
            ),
            Span(
                id=f"span-{trace_id}-embed",
                parentId=root_span_id,
                name="embed.generate_dense_vectors",
                service="vector-inference-engine",
                durationMs=125.0,
                offsetMs=4.0,
                status="ok",
                kind="INTERNAL",
                attributes={"model.name": "text-embedding-3-large", "dimensions": 1536},
            ),
            Span(
                id=f"span-{trace_id}-ann",
                parentId=root_span_id,
                name="qdrant.hnsw_ann_search",
                service="qdrant-cluster",
                durationMs=480.0,
                offsetMs=132.0,
                status="warn",
                kind="CLIENT",
                attributes={
                    "index.ef_search": 256,
                    "hnsw.vector_count": 8500000,
                    "quantization": "NONE (Full FP32)",
                },
                errorDetails="HNSW search time exceeded SLA threshold (480ms > 100ms budget). Unquantized vectors in RAM causing L3 cache thrashing.",
            ),
            Span(
                id=f"span-{trace_id}-n1",
                parentId=root_span_id,
                name="postgres.sequential_n_plus_one_rehydration",
                service="postgres-primary",
                durationMs=360.0,
                offsetMs=615.0,
                status="warn",
                kind="CLIENT",
                query="SELECT id, content, author_id FROM document_chunks WHERE id = $1",
                attributes={
                    "db.system": "postgresql",
                    "db.sequential_executions": 30,
                    "db.roundtrip_overhead_ms": 310,
                },
                errorDetails="Pattern detected: 30 individual row queries executed synchronously in loop instead of WHERE id = ANY($1).",
            ),
        ]
        return Trace(
            id=trace_id,
            rootEndpoint="/v1/vector/retrieve-context",
            httpMethod="POST",
            rootService="vector-inference-engine",
            durationMs=982.4,
            timestamp=now_iso,
            relativeTime="Just now",
            statusCode=200,
            status="degraded",
            spanCount=len(spans),
            errorCount=1,
            clientIp="142.250.190.46",
            environment=environment,
            region=region,
            spans=spans,
            tags=["rag-pipeline", "hnsw-ef-search", "n-plus-1-sql", "cache-miss"],
        )

    elif scenario_type == "auth_jwt_cache_stampede":
        trace_id = f"trace-auth-{trace_uid}"
        root_span_id = f"span-{trace_id}-root"
        spans = [
            Span(
                id=root_span_id,
                name="GET /v1/auth/introspect-jwt",
                service="auth-gateway",
                durationMs=1420.0,
                offsetMs=0.0,
                status="error",
                statusCode=429,
                kind="SERVER",
                attributes={"http.target": "/v1/auth/introspect-jwt"},
                errorDetails="HTTP 429: Downstream Identity Provider rate-limited public key JWKS requests.",
            ),
            Span(
                id=f"span-{trace_id}-redis",
                parentId=root_span_id,
                name="redis.get_cached_jwks",
                service="redis-cache-cluster",
                durationMs=4.1,
                offsetMs=1.5,
                status="ok",
                kind="CLIENT",
                attributes={"cache.key": "jwks:keyset", "cache.hit": False},
            ),
            Span(
                id=f"span-{trace_id}-idp",
                parentId=root_span_id,
                name="http.fetch_okta_jwks_keyset",
                service="auth-gateway",
                durationMs=1410.0,
                offsetMs=6.0,
                status="error",
                statusCode=429,
                kind="CLIENT",
                attributes={
                    "http.url": "https://auth.company.okta.com/oauth2/v1/keys",
                    "http.status_code": 429,
                    "concurrency.thundering_herd_count": 640,
                },
                errorDetails="429 Too Many Requests: Rate limit quota exhausted on IdP keyset endpoint during key rotation stampede.",
            ),
        ]
        return Trace(
            id=trace_id,
            rootEndpoint="/v1/auth/introspect-jwt",
            httpMethod="GET",
            rootService="auth-gateway",
            durationMs=1420.0,
            timestamp=now_iso,
            relativeTime="Just now",
            statusCode=429,
            status="error",
            spanCount=len(spans),
            errorCount=2,
            clientIp="138.199.12.8",
            environment=environment,
            region=region,
            spans=spans,
            tags=["auth-gateway", "cache-stampede", "idp-rate-limit", "thundering-herd"],
        )

    elif scenario_type == "stripe_webhook_connection_starvation":
        trace_id = f"trace-wh-{trace_uid}"
        root_span_id = f"span-{trace_id}-root"
        spans = [
            Span(
                id=root_span_id,
                name="POST /v1/webhooks/stripe/charge.succeeded",
                service="payment-router",
                durationMs=1640.0,
                offsetMs=0.0,
                status="error",
                statusCode=504,
                kind="SERVER",
                attributes={"http.target": "/v1/webhooks/stripe/charge.succeeded"},
                errorDetails="Gateway Timeout: Upstream DB connection acquisition timed out (>1500ms).",
            ),
            Span(
                id=f"span-{trace_id}-sig",
                parentId=root_span_id,
                name="crypto.verify_hmac_sha256",
                service="payment-router",
                durationMs=3.2,
                offsetMs=1.0,
                status="ok",
                kind="INTERNAL",
                attributes={"signature.valid": True},
            ),
            Span(
                id=f"span-{trace_id}-pool",
                parentId=root_span_id,
                name="postgres.acquire_connection_pool",
                service="postgres-primary",
                durationMs=1505.0,
                offsetMs=5.0,
                status="error",
                kind="CLIENT",
                attributes={
                    "pool.active_connections": 100,
                    "pool.max_capacity": 100,
                    "pool.queue_depth": 58,
                },
                errorDetails="FATAL: connection pool exhausted. Remaining timeout 0ms reached while waiting for idle socket.",
            ),
        ]
        return Trace(
            id=trace_id,
            rootEndpoint="/v1/webhooks/stripe/charge.succeeded",
            httpMethod="POST",
            rootService="payment-router",
            durationMs=1640.0,
            timestamp=now_iso,
            relativeTime="Just now",
            statusCode=504,
            status="critical",
            spanCount=len(spans),
            errorCount=2,
            clientIp="54.187.174.169",
            environment=environment,
            region=region,
            spans=spans,
            tags=["payments", "stripe-webhook", "connection-starvation", "db-pool-exhausted"],
        )

    elif scenario_type == "kafka_consumer_lag_spike":
        trace_id = f"trace-kfk-{trace_uid}"
        root_span_id = f"span-{trace_id}-root"
        spans = [
            Span(
                id=root_span_id,
                name="CONSUME events.orders.settled",
                service="event-broker",
                durationMs=780.0,
                offsetMs=0.0,
                status="warn",
                statusCode=200,
                kind="CONSUMER",
                attributes={
                    "kafka.topic": "events.orders.settled",
                    "kafka.partition": 2,
                    "kafka.consumer_lag": 14200,
                },
            ),
            Span(
                id=f"span-{trace_id}-ship",
                parentId=root_span_id,
                name="shipping.batch_dispatch_courier",
                service="order-orchestrator",
                durationMs=680.0,
                offsetMs=85.0,
                status="warn",
                kind="CLIENT",
                attributes={"carrier.api": "fedex-v3", "carrier.slow_response": True},
            ),
        ]
        return Trace(
            id=trace_id,
            rootEndpoint="CONSUME events.orders.settled",
            httpMethod="POST",
            rootService="event-broker",
            durationMs=780.0,
            timestamp=now_iso,
            relativeTime="Just now",
            statusCode=200,
            status="degraded",
            spanCount=len(spans),
            errorCount=0,
            clientIp="10.0.14.92",
            environment=environment,
            region=region,
            spans=spans,
            tags=["kafka-stream", "consumer-lag", "partition-skew", "async-worker"],
        )

    else:  # nominal_fastpath
        trace_id = f"trace-nom-{trace_uid}"
        root_span_id = f"span-{trace_id}-root"
        spans = [
            Span(
                id=root_span_id,
                name="GET /v1/catalog/product-inventory",
                service="order-orchestrator",
                durationMs=18.4,
                offsetMs=0.0,
                status="ok",
                statusCode=200,
                kind="SERVER",
                attributes={
                    "http.target": "/v1/catalog/product-inventory",
                    "http.method": "GET",
                    "cache.hit": True,
                },
            ),
            Span(
                id=f"span-{trace_id}-cache",
                parentId=root_span_id,
                name="redis.get_product_sku",
                service="redis-cache-cluster",
                durationMs=2.1,
                offsetMs=1.2,
                status="ok",
                kind="CLIENT",
                attributes={"redis.command": "GET", "key": "sku:99401"},
            ),
        ]
        return Trace(
            id=trace_id,
            rootEndpoint="/v1/catalog/product-inventory",
            httpMethod="GET",
            rootService="order-orchestrator",
            durationMs=18.4,
            timestamp=now_iso,
            relativeTime="Just now",
            statusCode=200,
            status="nominal",
            spanCount=len(spans),
            errorCount=0,
            clientIp="72.229.28.185",
            environment=environment,
            region=region,
            spans=spans,
            tags=["fastpath", "redis-cache-hit", "sub-20ms", "nominal"],
        )
