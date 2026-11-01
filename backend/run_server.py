import sys
from pathlib import Path

# Ensure workspace root is in sys.path
workspace_dir = Path(__file__).resolve().parent.parent
if str(workspace_dir) not in sys.path:
    sys.path.insert(0, str(workspace_dir))

import uvicorn
from backend.app.config import settings

def main():
    print("=" * 60)
    print(" DevTrace Kinetic Intelligence - Python Backend Server")
    print(f" Listening on: http://{settings.HOST}:{settings.PORT}")
    print(f" OpenAPI docs:  http://{settings.HOST}:{settings.PORT}/docs")
    print(f" Open-Weight AI: {settings.OPEN_WEIGHT_MODEL} via {settings.OPEN_WEIGHT_API_URL}")
    print("=" * 60)
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

if __name__ == "__main__":
    main()
