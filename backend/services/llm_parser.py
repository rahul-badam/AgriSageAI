from __future__ import annotations

import hashlib
import json
import re
import urllib.error
import urllib.request
from typing import Dict, List, Tuple

from backend import config

REQUIRED_FIELDS = ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]

RANGES = {
    "N": (10.0, 150.0),
    "P": (5.0, 120.0),
    "K": (5.0, 150.0),
    "temperature": (10.0, 45.0),
    "humidity": (20.0, 100.0),
    "rainfall": (0.0, 500.0),
    "ph": (3.5, 9.5),
}

SOIL_PROFILES = {
    "sandy loam": {"N": -10.0, "P": -5.0, "K": -6.0, "humidity": -5.0, "rainfall": -20.0, "temperature": 0.8, "ph": 0.2},
    "sandy": {"N": -18.0, "P": -8.0, "K": -10.0, "humidity": -10.0, "rainfall": -35.0, "temperature": 1.2, "ph": 0.35},
    "red": {"N": -12.0, "P": -6.0, "K": -4.0, "humidity": -4.0, "rainfall": -10.0, "ph": 0.15},
    "black": {"N": 8.0, "P": 2.0, "K": 10.0, "humidity": 4.0, "rainfall": 10.0, "temperature": -0.4, "ph": -0.05},
    "clay": {"N": 6.0, "P": 2.0, "K": 4.0, "humidity": 8.0, "rainfall": 18.0, "temperature": -0.6, "ph": -0.1},
    "alluvial": {"N": 6.0, "P": 6.0, "K": 6.0, "humidity": 3.0, "rainfall": 8.0, "ph": -0.1},
    "loamy": {"N": 4.0, "P": 4.0, "K": 4.0, "humidity": 2.0, "rainfall": 5.0},
}

PROMPT_TEMPLATE = """
You are an agricultural feature estimator for crop recommendation.
Based on the farmer context, estimate realistic values for:
N, P, K, temperature, humidity, rainfall, ph.

Inputs:
- Location: {location}
- Farm size (acres): {acres}
- Farmer input: {farmer_input}

Requirements:
- Return ONLY strict JSON with numeric values for all keys.
- Do not return null.
- Use agronomically plausible estimates for the location when details are missing.
- Keep values in realistic ranges.

Output keys exactly:
N, P, K, temperature, humidity, rainfall, ph
""".strip()



def _clamp(field: str, value: float) -> float:
    lo, hi = RANGES[field]
    return max(lo, min(hi, value))



def _normalize_features(features: Dict[str, float]) -> Dict[str, float]:
    normalized: Dict[str, float] = {}
    for field in REQUIRED_FIELDS:
        if field not in features:
            continue
        try:
            normalized[field] = round(_clamp(field, float(features[field])), 2)
        except (TypeError, ValueError):
            continue
    return normalized



def _parse_json_payload(text: str) -> Dict[str, float]:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {}

    if not isinstance(data, dict):
        return {}

    out: Dict[str, float] = {}
    for field in REQUIRED_FIELDS:
        value = data.get(field)
        if value is None:
            continue
        try:
            out[field] = float(value)
        except (TypeError, ValueError):
            continue
    return _normalize_features(out)



def _http_json_request(url: str, payload: dict, headers: dict) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))



def _try_gemini(location: str, acres: float, farmer_input: str) -> Dict[str, float]:
    if not config.GEMINI_API_KEY:
        return {}

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-1.5-flash:generateContent?key=" + config.GEMINI_API_KEY
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": PROMPT_TEMPLATE.format(
                            location=location,
                            acres=acres,
                            farmer_input=farmer_input or "(none)",
                        )
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }

    try:
        body = _http_json_request(
            endpoint,
            payload,
            headers={"Content-Type": "application/json"},
        )
        parts = body["candidates"][0]["content"]["parts"]
        text_output = "".join(str(part.get("text", "")) for part in parts)
        return _parse_json_payload(text_output)
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError):
        return {}



def _try_openai(location: str, acres: float, farmer_input: str) -> Dict[str, float]:
    if not config.OPENAI_API_KEY:
        return {}

    payload = {
        "model": "gpt-4o-mini",
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": "Estimate agronomic features from farmer context and output JSON only.",
            },
            {
                "role": "user",
                "content": PROMPT_TEMPLATE.format(
                    location=location,
                    acres=acres,
                    farmer_input=farmer_input or "(none)",
                ),
            },
        ],
    }

    try:
        body = _http_json_request(
            "https://api.openai.com/v1/chat/completions",
            payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {config.OPENAI_API_KEY}",
            },
        )
        content = body["choices"][0]["message"]["content"]
        return _parse_json_payload(content)
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError):
        return {}



def _extract_numeric_hints(text: str) -> Dict[str, float]:
    patterns = {
        "N": r"\b(?:n|nitrogen)\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "P": r"\b(?:p|phosphorus)\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "K": r"\b(?:k|potassium)\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "temperature": r"\b(?:temperature|temp)\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "humidity": r"\bhumidity\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "rainfall": r"\brainfall\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "ph": r"\bph\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
    }

    lowered = text.lower()
    hints: Dict[str, float] = {}
    for field, pattern in patterns.items():
        match = re.search(pattern, lowered)
        if match:
            hints[field] = float(match.group(1))
    return _normalize_features(hints)



def _heuristic_defaults(location: str, farmer_input: str) -> Dict[str, float]:
    token = hashlib.md5(location.strip().lower().encode("utf-8")).hexdigest()
    seed = int(token[:8], 16)

    def pick(lo: float, hi: float, shift: int) -> float:
        bucket = (seed >> shift) % 1000
        return lo + (bucket / 999.0) * (hi - lo)

    text = f"{location} {farmer_input}".lower()

    features = {
        "N": pick(35, 110, 0),
        "P": pick(20, 75, 3),
        "K": pick(20, 90, 6),
        "temperature": pick(20, 34, 9),
        "humidity": pick(45, 85, 12),
        "rainfall": pick(80, 260, 15),
        "ph": pick(5.5, 7.5, 18),
    }

    coastal_words = ["coastal", "delta", "kerala", "goa", "assam", "odisha", "andhra", "bengal"]
    dry_words = ["dry", "arid", "drought", "desert", "rajasthan", "rayalaseema"]
    hill_words = ["hill", "mountain", "himalaya", "uttarakhand", "himachal", "sikkim"]

    if any(word in text for word in coastal_words):
        features["humidity"] += 8
        features["rainfall"] += 70
    if any(word in text for word in dry_words):
        features["humidity"] -= 12
        features["rainfall"] -= 80
        features["temperature"] += 2
    if any(word in text for word in hill_words):
        features["temperature"] -= 4
        features["rainfall"] += 20

    return _normalize_features(features)



def _fill_missing(features: Dict[str, float], fallback: Dict[str, float]) -> Dict[str, float]:
    merged = dict(fallback)
    merged.update(features)
    return _normalize_features(merged)


def _detect_soil_profile(text: str) -> Dict[str, float]:
    lowered = text.lower()
    for key in sorted(SOIL_PROFILES.keys(), key=len, reverse=True):
        if key in lowered:
            return SOIL_PROFILES[key]
    return {}


def _apply_soil_adjustments(features: Dict[str, float], farmer_input: str) -> Dict[str, float]:
    profile = _detect_soil_profile(farmer_input)
    if not profile:
        return _normalize_features(features)

    adjusted = dict(features)
    for field, delta in profile.items():
        if field in adjusted:
            adjusted[field] = float(adjusted[field]) + float(delta)
    return _normalize_features(adjusted)



def infer_features_from_context(location: str, acres: float, farmer_input: str) -> Tuple[Dict[str, float], List[str], str]:
    notes: List[str] = []

    base_defaults = _heuristic_defaults(location, farmer_input)
    regex_hints = _extract_numeric_hints(farmer_input)

    gemini = _try_gemini(location=location, acres=acres, farmer_input=farmer_input)
    if gemini:
        merged = _fill_missing(gemini, _fill_missing(regex_hints, base_defaults))
        merged = _apply_soil_adjustments(merged, farmer_input)
        notes.append("Feature inference via Gemini with location-aware estimation.")
        return merged, notes, "gemini_inferred"

    openai = _try_openai(location=location, acres=acres, farmer_input=farmer_input)
    if openai:
        merged = _fill_missing(openai, _fill_missing(regex_hints, base_defaults))
        merged = _apply_soil_adjustments(merged, farmer_input)
        notes.append("Feature inference via OpenAI with location-aware estimation.")
        return merged, notes, "openai_inferred"

    fallback = _fill_missing(regex_hints, base_defaults)
    fallback = _apply_soil_adjustments(fallback, farmer_input)
    notes.append("Gemini/OpenAI unavailable; used deterministic location-based fallback inference.")
    return fallback, notes, "heuristic_fallback"
