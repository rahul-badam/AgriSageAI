from __future__ import annotations

import os
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "crop_model.pkl"
BRAIN_PATH = MODELS_DIR / "agrisage_brain.pkl"

ENV_PATH = BASE_DIR / "backend" / ".env"


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


try:
    from dotenv import load_dotenv

    load_dotenv(ENV_PATH)
except ImportError:
    _load_env_file(ENV_PATH)

APP_NAME = "AgriSageAI Backend"
APP_VERSION = "1.1.0"
API_PREFIX = "/api/v1"

DEFAULT_CORS_ORIGINS = ["*"]


def get_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw.strip():
        return DEFAULT_CORS_ORIGINS
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
