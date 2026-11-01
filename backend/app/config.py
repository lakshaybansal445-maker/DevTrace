import os
from pathlib import Path

# Safe loading of environment variables without hard dependency on dotenv
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
try:
    from dotenv import load_dotenv
    load_dotenv(WORKSPACE_ROOT / ".env.local")
    load_dotenv(WORKSPACE_ROOT / ".env")
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "DevTrace Kinetic Intelligence API"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("DEVTRACE_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("DEVTRACE_PORT", "8000"))
    
    # Open-Weight Model configuration (e.g., Gemma 4 via Ollama / vLLM / HuggingFace)
    OPEN_WEIGHT_MODEL: str = os.getenv("OPEN_WEIGHT_MODEL", "gemma4:latest")
    OPEN_WEIGHT_API_URL: str = os.getenv("OPEN_WEIGHT_API_URL", "http://localhost:11434")
    OPEN_WEIGHT_API_KEY: str | None = os.getenv("OPEN_WEIGHT_API_KEY")
    OPEN_WEIGHT_TIMEOUT_SECONDS: float = float(os.getenv("OPEN_WEIGHT_TIMEOUT_SECONDS", "8.0"))
    
    # Allowed CORS origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]

settings = Settings()
