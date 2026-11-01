import json
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from ..storage.repository import repo

router = APIRouter(prefix="/api/stream", tags=["stream"])

@router.get("")
async def stream_telemetry(request: Request):
    """
    Server-Sent Events (SSE) live streaming endpoint.
    Streams live ingested traces, decision updates, and telemetry signals in real time.
    """
    queue = repo.subscribe_stream()

    async def event_generator():
        try:
            # Send initial connected banner
            initial_event = json.dumps({"type": "stream_connected", "message": "DevTrace live telemetry stream established"})
            yield f"data: {initial_event}\n\n"

            while True:
                # Disconnect check
                if await request.is_disconnected():
                    break

                try:
                    # Wait up to 10 seconds for an event, else send a keepalive ping
                    data = await asyncio.wait_for(queue.get(), timeout=10.0)
                    yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            repo.unsubscribe_stream(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
