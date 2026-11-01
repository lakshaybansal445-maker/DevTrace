"""
OpenTelemetry Instrumented Python Microservice Example.

Demonstrates how a real Python application (e.g. order processing service) uses the
official OpenTelemetry SDK to create distributed spans for authentication,
database queries, and HTTP requests, and exports them to DevTrace Kinetic Intelligence.
"""

import sys
import time
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, SpanExporter, SpanExportResult

DEVTRACE_API_URL = "http://127.0.0.1:8000/api/traces"

class DevTraceSpanExporter(SpanExporter):
    """Custom OpenTelemetry SpanExporter that formats spans and posts to DevTrace API."""
    def __init__(self, endpoint: str = DEVTRACE_API_URL):
        self.endpoint = endpoint

    def export(self, spans) -> SpanExportResult:
        if not spans:
            return SpanExportResult.SUCCESS

        # Find root span (span without parent or first span)
        root_span = next((s for s in spans if s.parent is None), spans[0])
        root_name = root_span.name
        root_service = root_span.resource.attributes.get("service.name", "python-order-service")

        formatted_spans = []
        start_time_ns = root_span.start_time

        for s in spans:
            duration_ms = round((s.end_time - s.start_time) / 1_000_000, 2)
            offset_ms = max(0.0, round((s.start_time - start_time_ns) / 1_000_000, 2))
            is_err = not s.status.is_ok and s.status.status_code.name == "ERROR"

            formatted_spans.append({
                "id": f"span-{s.context.span_id:016x}",
                "parentId": f"span-{s.parent.span_id:016x}" if s.parent else None,
                "name": s.name,
                "service": s.attributes.get("service.name", root_service),
                "durationMs": duration_ms,
                "offsetMs": offset_ms,
                "status": "error" if is_err else "ok",
                "statusCode": s.attributes.get("http.status_code", 200),
                "kind": "SERVER" if s.parent is None else "CLIENT",
                "attributes": dict(s.attributes),
                "query": s.attributes.get("db.statement"),
                "errorDetails": s.status.description if is_err else None,
            })

        total_duration = round((root_span.end_time - root_span.start_time) / 1_000_000, 2)
        has_error = any(s["status"] == "error" for s in formatted_spans)

        payload = {
            "endpoint": root_name,
            "method": root_span.attributes.get("http.method", "POST"),
            "service": root_service,
            "durationMs": total_duration,
            "statusCode": 500 if has_error else 200,
            "spans": formatted_spans,
            "environment": "production",
            "region": "us-east-1",
            "tags": ["opentelemetry-sdk", "python-microservice", root_service],
        }

        try:
            resp = requests.post(self.endpoint, json=payload, timeout=5)
            if resp.status_code == 201:
                data = resp.json()
                print(f"[OTel Exporter] Ingested Trace '{data['id']}' into DevTrace ({len(formatted_spans)} spans, {total_duration}ms)")
                return SpanExportResult.SUCCESS
            else:
                print(f"[OTel Exporter] Ingestion failed: {resp.status_code} - {resp.text}")
                return SpanExportResult.FAILURE
        except Exception as e:
            print(f"[OTel Exporter] Connection error: {e}")
            return SpanExportResult.FAILURE

    def shutdown(self):
        pass


def setup_tracer():
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(DevTraceSpanExporter()))
    trace.set_tracer_provider(provider)
    return trace.get_tracer("order-fulfillment-service", "1.0.0")


def simulate_real_life_order_pipeline(tracer, inject_db_deadlock: bool = False):
    """Simulates a distributed order checkout with nested spans and timing."""
    print(f"\n[App] Executing real-life order fulfillment workflow (fault injected: {inject_db_deadlock})...")

    with tracer.start_as_current_span(
        "POST /v2/orders/checkout",
        attributes={
            "http.method": "POST",
            "http.target": "/v2/orders/checkout",
            "service.name": "order-orchestrator",
            "customer.tier": "platinum",
        }
    ) as root:
        # Step 1: Auth JWT verification
        with tracer.start_as_current_span(
            "auth.verify_bearer_token",
            attributes={"service.name": "auth-gateway", "jwt.sub": "usr_94102"}
        ):
            time.sleep(0.02)  # 20ms

        # Step 2: Inventory reservation in Redis
        with tracer.start_as_current_span(
            "redis.reserve_inventory_lease",
            attributes={"service.name": "redis-cache-cluster", "sku": "SKU-PRO-4K", "db.statement": "SETNX lock:sku:4k 1"}
        ):
            time.sleep(0.01)  # 10ms

        # Step 3: Database atomic payment & balance update
        with tracer.start_as_current_span(
            "postgres.update_ledger_balance",
            attributes={
                "service.name": "postgres-primary",
                "db.system": "postgresql",
                "db.statement": "SELECT balance FROM accounts WHERE id = 'acc_491' FOR UPDATE",
            }
        ) as db_span:
            if inject_db_deadlock:
                time.sleep(0.35)  # 350ms delay
                db_span.set_status(trace.StatusCode.ERROR, "ERROR: 40001 serialization failure deadlock detected")
                root.set_status(trace.StatusCode.ERROR, "Transaction rollback due to DB deadlock")
            else:
                time.sleep(0.04)  # 40ms normal

        # Step 4: Kafka event publishing
        with tracer.start_as_current_span(
            "kafka.produce_order_event",
            attributes={"service.name": "event-broker", "messaging.destination": "events.orders.settled"}
        ):
            time.sleep(0.015)  # 15ms


def main():
    tracer = setup_tracer()
    
    # 1. Normal order checkout
    simulate_real_life_order_pipeline(tracer, inject_db_deadlock=False)
    time.sleep(1)

    # 2. Checkout with deadlock error
    simulate_real_life_order_pipeline(tracer, inject_db_deadlock=True)

if __name__ == "__main__":
    main()
