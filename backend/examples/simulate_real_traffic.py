"""
Real-life Production Traffic & Failure Scenario Simulator for DevTrace Kinetic Intelligence.

Usage:
    # 1. Run all real-life scenarios sequentially:
    python backend/examples/simulate_real_traffic.py --all

    # 2. Trigger a specific real-life failure scenario and get AI/Kinetic architectural diagnosis:
    python backend/examples/simulate_real_traffic.py --scenario ecommerce_checkout_deadlock
    python backend/examples/simulate_real_traffic.py --scenario llm_rag_vector_bottleneck
    python backend/examples/simulate_real_traffic.py --scenario auth_jwt_cache_stampede
    python backend/examples/simulate_real_traffic.py --scenario stripe_webhook_connection_starvation

    # 3. Stream continuous realistic live traffic:
    python backend/examples/simulate_real_traffic.py --continuous --interval 2.0
"""

import sys
import time
import argparse
import random
from typing import Optional

# Ensure UTF-8 output on Windows PowerShell / cmd
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    import requests
except ImportError:
    print("Error: 'requests' package required. Run: pip install requests")
    sys.exit(1)

BASE_URL = "http://127.0.0.1:8000"

SCENARIOS = [
    "ecommerce_checkout_deadlock",
    "llm_rag_vector_bottleneck",
    "auth_jwt_cache_stampede",
    "stripe_webhook_connection_starvation",
    "kafka_consumer_lag_spike",
    "nominal_fastpath",
]

def check_backend_connection() -> bool:
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=3)
        if r.status_code == 200:
            data = r.json()
            print(f"[OK] Connected to DevTrace API (Version {data.get('version')}, Uptime {data.get('uptimeSeconds')}s)")
            return True
    except Exception as e:
        print(f"[ERROR] Failed to connect to DevTrace backend at {BASE_URL}: {e}")
        print("    Make sure the backend is running: python backend/run_server.py")
        return False
    return False

def run_scenario(scenario_name: str, analyze: bool = True):
    print(f"\n{'='*70}")
    print(f"[*] Ingesting Real-Life Scenario: {scenario_name}")
    print(f"{'='*70}")

    url = f"{BASE_URL}/api/traces/scenario/{scenario_name}"
    resp = requests.post(url, timeout=10)
    if resp.status_code != 201:
        print(f"[!] Error ingesting scenario: HTTP {resp.status_code} - {resp.text}")
        return None

    trace = resp.json()
    print(f"[+] Trace Ingested: {trace['id']}")
    print(f"    Root Endpoint:  {trace['httpMethod']} {trace['rootEndpoint']}")
    print(f"    Root Service:   {trace['rootService']}")
    print(f"    Duration:       {trace['durationMs']}ms")
    print(f"    Status:         {trace['status'].upper()} (HTTP {trace['statusCode']})")
    print(f"    Spans Count:    {trace['spanCount']} (Errors: {trace['errorCount']})")
    print(f"    Tags:           {', '.join(trace['tags'])}")

    print("\n    Span Waterfall Breakdown:")
    for s in trace.get("spans", []):
        status_icon = "OK" if s["status"] == "ok" else "WARN" if s["status"] == "warn" else "ERR"
        print(f"      [{status_icon:>4}] {s['service']:<24} {s['name']:<40} {s['durationMs']:>7.1f}ms")
        if s.get("errorDetails"):
            print(f"            Details: {s['errorDetails']}")
        if s.get("query"):
            print(f"            SQL Query: {s['query']}")

    if analyze and trace["status"] in ["critical", "error", "degraded"]:
        print(f"\n[*] Triggering Architecture Decision Intelligence Diagnosis for {trace['id']}...")
        analyze_resp = requests.post(
            f"{BASE_URL}/api/decisions/analyze",
            json={"traceId": trace["id"], "useOpenWeightModel": True},
            timeout=30,
        )
        if analyze_resp.status_code == 201:
            decision = analyze_resp.json()
            print(f"[OK] Architectural Decision Formulated: {decision['id']}")
            print(f"    Title:        {decision['title']}")
            print(f"    Severity:     {decision['severity'].upper()}")
            print(f"    Root Cause:   {decision['rootCause']}")
            print(f"    Hypothesis:   {decision['architecturalHypothesis']}")
            print(f"    Metrics:      {decision.get('impactMetrics', {})}")
            print(f"    Patch Target: {decision['recommendedPatch']['filePath']}")
            print(f"    Patch Snippet:\n{'-'*60}")
            for line in decision['recommendedPatch']['codeSnippet'].splitlines()[:12]:
                print(f"      {line}")
            print(f"{'-'*60}")
        else:
            print(f"[!] Analysis failed: HTTP {analyze_resp.status_code} - {analyze_resp.text}")

    return trace

def run_continuous_traffic(interval: float = 2.0):
    print(f"[*] Starting continuous real-life traffic simulation (interval: {interval}s)...")
    print("    Press Ctrl+C to stop.\n")

    counter = 0
    while True:
        try:
            counter += 1
            # 85% nominal traffic, 15% realistic faults
            roll = random.random()
            if roll < 0.85:
                # Fast path simulation
                requests.post(
                    f"{BASE_URL}/api/traces/simulate",
                    json={
                        "endpoint": random.choice([
                            "/v1/auth/introspect-jwt",
                            "/v2/orders/settle-cart",
                            "/v1/vector/retrieve-context",
                            "/v1/catalog/product-inventory",
                        ]),
                        "method": "POST" if roll < 0.5 else "GET",
                        "service": random.choice(["auth-gateway", "order-orchestrator", "redis-cache-cluster"]),
                        "durationMs": round(random.uniform(14.0, 95.0), 1),
                        "statusCode": 200,
                        "hasDbQuery": roll < 0.4,
                        "errorType": "none",
                    },
                    timeout=5,
                )
                print(f"[{counter}] Ingested nominal request #{counter}")
            else:
                # Random realistic fault scenario
                scen = random.choice([
                    "ecommerce_checkout_deadlock",
                    "llm_rag_vector_bottleneck",
                    "auth_jwt_cache_stampede",
                    "stripe_webhook_connection_starvation",
                ])
                run_scenario(scen, analyze=False)

            time.sleep(interval)
        except KeyboardInterrupt:
            print("\nSimulation stopped.")
            break
        except Exception as e:
            print(f"[!] Simulation iteration error: {e}")
            time.sleep(interval)

def main():
    parser = argparse.ArgumentParser(description="DevTrace Real-Life Traffic & Scenario Simulator")
    parser.add_argument("--all", action="store_true", help="Run all 6 real-life production scenarios")
    parser.add_argument("--scenario", choices=SCENARIOS, help="Trigger a specific scenario")
    parser.add_argument("--continuous", action="store_true", help="Stream continuous live traffic")
    parser.add_argument("--interval", type=float, default=2.0, help="Interval in seconds for continuous mode")
    parser.add_argument("--url", type=str, default="http://127.0.0.1:8000", help="DevTrace API URL")

    args = parser.parse_args()
    global BASE_URL
    BASE_URL = args.url.rstrip("/")

    if not check_backend_connection():
        sys.exit(1)

    if args.scenario:
        run_scenario(args.scenario, analyze=True)
    elif args.all:
        for scen in SCENARIOS:
            run_scenario(scen, analyze=True)
            time.sleep(1.0)
        print("\n[✓] All 6 real-life scenarios simulated and ingested successfully!")
    elif args.continuous:
        run_continuous_traffic(args.interval)
    else:
        # Default behavior: run all scenarios
        print("[i] No option specified. Running all 6 real-life production scenarios by default...")
        for scen in SCENARIOS:
            run_scenario(scen, analyze=True)
            time.sleep(1.0)
        print("\n[✓] Finished executing real-life scenarios. Check the DevTrace UI!")

if __name__ == "__main__":
    main()
