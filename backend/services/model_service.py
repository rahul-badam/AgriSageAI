from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd

FEATURE_ORDER = ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]


@dataclass
class PredictionResult:
    crop: str
    confidence: float


class CropModelService:
    def __init__(self, model_path: Path, dataset_path: Path):
        self.model_path = model_path
        self.dataset_path = dataset_path
        self.model = None
        self.model_load_error = ""
        self.dataset = None

        self._load_model_if_possible()
        self._load_dataset_if_possible()

    def _load_model_if_possible(self) -> None:
        if not self.model_path.exists():
            self.model_load_error = f"Model file not found at: {self.model_path}"
            return

        try:
            model = joblib.load(self.model_path)
        except Exception as exc:
            self.model_load_error = str(exc)
            return

        if not hasattr(model, "predict_proba") or not hasattr(model, "classes_"):
            self.model_load_error = "Loaded model missing predict_proba/classes_"
            return

        self.model = model

    def _load_dataset_if_possible(self) -> None:
        if not self.dataset_path.exists():
            return
        try:
            data = pd.read_csv(self.dataset_path)
            expected = set(FEATURE_ORDER + ["label"])
            if expected.issubset(set(data.columns)):
                self.dataset = data
        except Exception:
            self.dataset = None

    def _predict_from_model(self, ordered_values: dict, k: int) -> List[PredictionResult]:
        input_df = pd.DataFrame([ordered_values], columns=FEATURE_ORDER)
        probs = self.model.predict_proba(input_df)[0]
        classes = self.model.classes_

        top_indices = np.argsort(probs)[::-1][:k]
        return [PredictionResult(crop=str(classes[i]), confidence=round(float(probs[i]), 6)) for i in top_indices]

    def _predict_from_dataset_fallback(self, ordered_values: dict, k: int) -> List[PredictionResult]:
        if self.dataset is None:
            raise RuntimeError(
                "Primary model unavailable and dataset fallback not found. "
                "Install dependencies from backend/requirements.txt."
            )

        features = self.dataset[FEATURE_ORDER].astype(float)
        target = self.dataset["label"].astype(str)

        row = pd.Series(ordered_values)
        std = features.std().replace(0, 1)
        z = (features - row) / std
        distances = np.sqrt((z ** 2).sum(axis=1))

        nearest_n = min(75, len(features))
        nearest_idx = np.argsort(distances.values)[:nearest_n]
        nearest_labels = target.iloc[nearest_idx]

        counts = nearest_labels.value_counts()
        total = counts.sum()

        top = counts.head(k)
        return [
            PredictionResult(crop=str(crop), confidence=round(float(count / total), 6))
            for crop, count in top.items()
        ]

    def predict_top_k(self, features: dict, k: int = 3) -> List[PredictionResult]:
        ordered_values = {name: float(features[name]) for name in FEATURE_ORDER}

        if self.model is not None:
            return self._predict_from_model(ordered_values, k)

        return self._predict_from_dataset_fallback(ordered_values, k)

    @property
    def using_fallback(self) -> bool:
        return self.model is None
