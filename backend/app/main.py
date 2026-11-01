import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api import (
    routes_traces,
    routes_decisions,
    routes_mesh,
    routes_pipelines,
    routes_slos,
    routes_stream,
    routes_system,
    routes_github,
    routes_gitlab,
)
from .storage.repository import repo
from .engine.scenario_gen import generate_scenario_trace

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("devtrace")

# Optional background generator task
async def background_telemetry_ticker():
    """Periodically emits light background traces to keep live telemetry vibrant."""
    logger.info("DevTrace background telemetry generator active")
    while True:
        try:
            await asyncio.sleep(12)
            # Emit a light nominal trace
            trace = generate_scenario_trace("nominal_fastpath")
            await repo.add_trace(trace)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Background ticker error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    ticker_task = None
    if os.getenv("DEVTRACE_AUTO_TICKER", "true").lower() == "true":
        ticker_task = asyncio.create_task(background_telemetry_ticker())
    yield
    # Shutdown
    if ticker_task:
        ticker_task.cancel()
        try:
            await ticker_task
        except asyncio.CancelledError:
            pass
    logger.info("DevTrace API shutdown complete")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for distributed tracing, pipeline telemetry, and kinetic architecture decision intelligence.",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(routes_system.router)
app.include_router(routes_traces.router)
app.include_router(routes_decisions.router)
app.include_router(routes_mesh.router)
app.include_router(routes_pipelines.router)
app.include_router(routes_slos.router)
app.include_router(routes_stream.router)
app.include_router(routes_github.router)
app.include_router(routes_gitlab.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
