from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import pandas as pd

from backend.services.climate_service import climate_risk_engine

logger = logging.getLogger(__name__)


class MarketService:
    def __init__(self, brain_path: Path):
        self.brain_path = brain_path
        self.brain = self._try_load_brain(brain_path)

    @staticmethod
    def _try_load_brain(brain_path: Path) -> Optional[dict]:
        if not brain_path.exists():
            return None
        try:
            brain = joblib.load(brain_path)
            if isinstance(brain, dict):
                return brain
        except Exception as exc:
            logger.warning("Could not load agrisage brain: %s", exc)
        return None

    def _brain_price_and_yield(self, features: Dict[str, float]) -> Optional[Dict[str, float]]:
        if not self.brain:
            return None

        try:
            price_model = self.brain.get("price_model")
            yield_model = self.brain.get("yield_model")
            volatility = float(self.brain.get("volatility", 0.15))
            last_date = self.brain.get("last_date")
            if price_model is None or yield_model is None or last_date is None:
                return None

            future = pd.DataFrame({"ds": pd.date_range(start=last_date, periods=91, freq="D")[1:]})
            forecast = price_model.predict(future)
            avg_price = float(forecast["yhat1"].mean())

            soil = pd.DataFrame(
                [[features["N"], features["P"], features["rainfall"], features["ph"]]],
                columns=["Nitrogen", "Phosphorous", "Rainfall", "pH"],
            )
            predicted_yield = float(yield_model.predict(soil)[0])

            return {
                "price_per_quintal": avg_price,
                "yield_per_acre": predicted_yield,
                "volatility": volatility,
            }
        except Exception as exc:
            logger.warning("Brain market prediction failed, using fallback: %s", exc)
            return None

    @staticmethod
    def _fallback_price_and_yield(features: Dict[str, float], confidence: float) -> Dict[str, float]:
        rainfall_factor = max(0.7, min(1.35, features["rainfall"] / 180.0))
        temp_penalty = max(0.72, 1 - abs(features["temperature"] - 27) * 0.015)
        ph_factor = max(0.8, 1 - abs(features["ph"] - 6.5) * 0.1)

        base_price = 2100 + (confidence * 2900)
        base_yield = 12 + (features["N"] + features["P"] + features["K"]) / 42.0

        return {
            "price_per_quintal": round(base_price * ph_factor, 2),
            "yield_per_acre": round(base_yield * rainfall_factor * temp_penalty, 2),
            "volatility": 0.16,
        }

    def build_market_predictions(
        self,
        top_crops: List[Dict[str, float]],
        features: Dict[str, float],
        acres: float,
    ) -> Dict[str, object]:
        per_crop: List[Dict[str, object]] = []

        for item in top_crops:
            crop = str(item["crop"])
            confidence = float(item["confidence"])

            metrics = self._brain_price_and_yield(features)
            if metrics is None:
                metrics = self._fallback_price_and_yield(features, confidence)

            climate = climate_risk_engine(
                base_price=float(metrics["price_per_quintal"]),
                base_yield=float(metrics["yield_per_acre"]),
                rainfall=float(features["rainfall"]),
                price_volatility=float(metrics["volatility"]),
                yield_volatility=0.10,
            )

            expected_per_acre = float(climate["baseline"]["expected_revenue"])
            worst_per_acre = float(climate["baseline"]["worst_case_revenue"])

            per_crop.append(
                {
                    "crop": crop,
                    "price_per_quintal": round(float(metrics["price_per_quintal"]), 2),
                    "yield_per_acre": round(float(metrics["yield_per_acre"]), 2),
                    "expected_revenue_per_acre": round(expected_per_acre, 2),
                    "worst_case_revenue_per_acre": round(worst_per_acre, 2),
                    "expected_revenue_total": round(expected_per_acre * acres, 2),
                    "worst_case_revenue_total": round(worst_per_acre * acres, 2),
                    "cvi": float(climate["baseline"]["CVI"]),
                    "risk_level": climate["risk_level"],
                    "confidence": round(confidence, 4),
                }
            )

        per_crop.sort(key=lambda row: float(row["expected_revenue_total"]), reverse=True)

        overall_cvi = round(sum(float(row["cvi"]) for row in per_crop) / max(len(per_crop), 1), 2)

        return {
            "per_crop": per_crop,
            "overall_cvi": overall_cvi,
            "recommended_market_crop": per_crop[0]["crop"] if per_crop else None,
        }
