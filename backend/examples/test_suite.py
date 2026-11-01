"""
DevTrace Kinetic Intelligence - Backend API Automated Test Suite.

Runs end-to-end integration tests against all API endpoints with real-life scenarios.
Usage:
    python backend/examples/test_suite.py
"""

import sys
import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 70)
    print(" DevTrace Kinetic Intelligence - Backend Integration Test Suite")
    print(" Target API:", BASE_URL)
    print("=" * 70)

    passed = 0
    total = 0

    def assert_test(name: str, condition: bool, extra_info: str = ""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name} {f'({extra_info})' if extra_info else ''}")
        else:
            print(f" [FAIL] {name} - {extra_info}")

    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        assert_test("Health check endpoint", r.status_code == 200 and r.json().get("status") == "healthy", f"HTTP {r.status_code}")
    except Exception as e:
        print(f"[FAIL] Could not connect to {BASE_URL}: {e}")
        print("Please start the backend server: python backend/run_server.py")
        sys.exit(1)

    # 2. Scenarios list
    r = requests.get(f"{BASE_URL}/api/scenarios", timeout=5)
    scenarios = r.json().get("scenarios", [])
    assert_test("List available real-world scenarios", r.status_code == 200 and len(scenarios) >= 6, f"{len(scenarios)} scenarios available")

    # 3. Ingest real-life scenario: ecommerce checkout deadlock
    r = requests.post(f"{BASE_URL}/api/traces/scenario/ecommerce_checkout_deadlock", timeout=5)
    deadlock_trace = r.json()
    assert_test(
        "Ingest E-commerce Checkout Deadlock scenario",
        r.status_code == 201 and deadlock_trace.get("status") == "critical",
        f"ID: {deadlock_trace.get('id')}, Spans: {deadlock_trace.get('spanCount')}"
    )

    # 4. Trigger Architecture Decision Intelligence analysis on deadlock trace
    trace_id = deadlock_trace.get("id")
    r = requests.post(
        f"{BASE_URL}/api/decisions/analyze",
        json={"traceId": trace_id, "useOpenWeightModel": True},
        timeout=30,
    )
    decision = r.json()
    assert_test(
        "Architecture Decision Intelligence Analysis",
        r.status_code == 201 and "deadlock" in decision.get("title", "").lower() or "ledger" in decision.get("title", "").lower() or "transaction" in decision.get("title", "").lower(),
        f"ADR ID: {decision.get('id')}, Title: {decision.get('title')}"
    )

    # 5. Apply decision
    decision_id = decision.get("id")
    r = requests.patch(
        f"{BASE_URL}/api/decisions/{decision_id}",
        json={"status": "applied"},
        timeout=5,
    )
    assert_test(
        "Apply Architectural Decision Record status",
        r.status_code == 200 and r.json().get("status") == "applied",
        f"ADR {decision_id} -> applied"
    )

    # 6. Query filtered traces
    r = requests.get(f"{BASE_URL}/api/traces?status=critical", timeout=5)
    traces = r.json()
    assert_test(
        "Filter traces by status ('critical')",
        r.status_code == 200 and len(traces) >= 1,
        f"Found {len(traces)} critical traces"
    )

    # 7. Check service mesh health updates
    r = requests.get(f"{BASE_URL}/api/mesh/services", timeout=5)
    services = r.json()
    assert_test(
        "Fetch service mesh nodes topology",
        r.status_code == 200 and len(services) >= 9,
        f"{len(services)} services active"
    )

    # 8. Trigger CI/CD pipeline
    r = requests.post(
        f"{BASE_URL}/api/pipelines/trigger",
        json={"branch": "main", "commitMessage": "test: hermetic verification"},
        timeout=5,
    )
    pipeline = r.json()
    assert_test(
        "Trigger CI/CD hermetic pipeline run",
        r.status_code == 201 and pipeline.get("status") == "passed",
        f"Run ID: {pipeline.get('id')}, Stages: {len(pipeline.get('stages', []))}"
    )

    # 9. Audit SLOs
    r = requests.post(f"{BASE_URL}/api/slos/audit", timeout=5)
    slos = r.json()
    assert_test(
        "Audit Service Level Objectives and burn rates",
        r.status_code == 200 and len(slos) >= 4,
        f"{len(slos)} SLOs evaluated"
    )

    # 10. Ingest LLM RAG vector bottleneck scenario
    r = requests.post(f"{BASE_URL}/api/traces/scenario/llm_rag_vector_bottleneck", timeout=5)
    rag_trace = r.json()
    assert_test(
        "Ingest LLM RAG vector bottleneck scenario",
        r.status_code == 201 and rag_trace.get("status") == "degraded",
        f"ID: {rag_trace.get('id')}, Duration: {rag_trace.get('durationMs')}ms"
    )

    print("=" * 70)
    print(f" Test Results: {passed}/{total} Passed ({(passed/total)*100:.1f}%)")
    print("=" * 70)

    if passed == total:
        print("[OK] All tests passed! Backend is fully functional and ready for testing real-life examples.")
        return 0
    else:
        print("[!] Some tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
