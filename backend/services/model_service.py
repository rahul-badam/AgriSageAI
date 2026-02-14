from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd

FEATURE_ORDER = ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]


@dataclass
class PredictionResult:
    crop: str
    confidence: float


@dataclass
class FeatureContributionResult:
    feature: str
    value: float
    impact: float


@dataclass
class ExplainabilityResult:
    method: str
    top_crop: str
    summary: str
    feature_contributions: List[FeatureContributionResult]


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
        distances = np.sqrt((z**2).sum(axis=1))

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

    @staticmethod
    def _build_summary(top_crop: str, contributions: List[FeatureContributionResult]) -> str:
        positives = sorted((c for c in contributions if c.impact > 0), key=lambda x: x.impact, reverse=True)[:2]
        negatives = sorted((c for c in contributions if c.impact < 0), key=lambda x: x.impact)[:2]

        pos_text = ", ".join(f"{c.feature} ({c.impact:+.3f})" for c in positives) if positives else "none"
        neg_text = ", ".join(f"{c.feature} ({c.impact:+.3f})" for c in negatives) if negatives else "none"

        return (
            f"For {top_crop}, the strongest positive factors are {pos_text}. "
            f"Main limiting factors are {neg_text}."
        )

    @staticmethod
    def _extract_shap_vector(shap_values: object, class_index: int) -> Optional[np.ndarray]:
        try:
            if isinstance(shap_values, list):
                arr = np.asarray(shap_values[class_index])
                if arr.ndim == 2:
                    return arr[0].astype(float)
                return None

            arr = np.asarray(shap_values)
            if arr.ndim == 2:
                return arr[0].astype(float)

            if arr.ndim == 3:
                # Common layouts: (samples, features, classes) or (classes, samples, features)
                if arr.shape[0] == 1 and arr.shape[2] > class_index:
                    return arr[0, :, class_index].astype(float)
                if arr.shape[0] > class_index and arr.shape[1] == 1:
                    return arr[class_index, 0, :].astype(float)
                if arr.shape[0] == 1:
                    return arr[0, :, 0].astype(float)
            return None
        except Exception:
            return None

    def _explain_with_shap(self, ordered_values: dict, top_crop: str) -> Optional[ExplainabilityResult]:
        if self.model is None:
            return None

        try:
            import shap
        except Exception:
            return None

        try:
            input_df = pd.DataFrame([ordered_values], columns=FEATURE_ORDER)
            classes = [str(c) for c in getattr(self.model, "classes_", [])]
            class_index = classes.index(top_crop) if top_crop in classes else 0

            explainer = shap.TreeExplainer(self.model)
            shap_values = explainer.shap_values(input_df)
            vector = self._extract_shap_vector(shap_values, class_index)
            if vector is None:
                return None

            contributions = [
                FeatureContributionResult(
                    feature=feature,
                    value=float(ordered_values[feature]),
                    impact=float(vector[idx]),
                )
                for idx, feature in enumerate(FEATURE_ORDER)
            ]
            contributions.sort(key=lambda item: abs(item.impact), reverse=True)
            summary = self._build_summary(top_crop, contributions)
            return ExplainabilityResult(
                method="shap_tree_explainer",
                top_crop=top_crop,
                summary=summary,
                feature_contributions=contributions,
            )
        except Exception:
            return None

    def _explain_with_surrogate(self, ordered_values: dict, top_crop: str) -> ExplainabilityResult:
        if self.dataset is not None:
            means = self.dataset[FEATURE_ORDER].astype(float).mean()
            stds = self.dataset[FEATURE_ORDER].astype(float).std().replace(0, 1.0)
            contributions = [
                FeatureContributionResult(
                    feature=feature,
                    value=float(ordered_values[feature]),
                    impact=float((ordered_values[feature] - means[feature]) / stds[feature]),
                )
                for feature in FEATURE_ORDER
            ]
        else:
            centers = {
                "N": 70.0,
                "P": 45.0,
                "K": 45.0,
                "temperature": 27.0,
                "humidity": 65.0,
                "rainfall": 180.0,
                "ph": 6.5,
            }
            scales = {
                "N": 35.0,
                "P": 25.0,
                "K": 25.0,
                "temperature": 8.0,
                "humidity": 20.0,
                "rainfall": 120.0,
                "ph": 1.0,
            }
            contributions = [
                FeatureContributionResult(
                    feature=feature,
                    value=float(ordered_values[feature]),
                    impact=float((ordered_values[feature] - centers[feature]) / scales[feature]),
                )
                for feature in FEATURE_ORDER
            ]

        contributions.sort(key=lambda item: abs(item.impact), reverse=True)
        summary = self._build_summary(top_crop, contributions)

        return ExplainabilityResult(
            method="surrogate_zscore",
            top_crop=top_crop,
            summary=summary,
            feature_contributions=contributions,
        )

    def explain_top_crop(self, features: dict, top_crop: str) -> ExplainabilityResult:
        ordered_values = {name: float(features[name]) for name in FEATURE_ORDER}

        shap_result = self._explain_with_shap(ordered_values, top_crop)
        if shap_result is not None:
            return shap_result

        return self._explain_with_surrogate(ordered_values, top_crop)

    @property
    def using_fallback(self) -> bool:
        return self.model is None
