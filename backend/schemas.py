from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class SoilFeatures(BaseModel):
    N: float = Field(..., description="Nitrogen")
    P: float = Field(..., description="Phosphorus")
    K: float = Field(..., description="Potassium")
    temperature: float
    humidity: float
    rainfall: float
    ph: float


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    location: str = Field(..., min_length=2, description="District, state, or region")
    acres: float = Field(..., gt=0, description="Farm size in acres")
    farmer_input: str = Field(
        default="",
        validation_alias=AliasChoices("farmer_input", "farmer_text"),
        description="Voice transcript or typed farmer context",
    )


class CropPrediction(BaseModel):
    crop: str
    confidence: float


class MarketCropPrediction(BaseModel):
    crop: str
    price_per_quintal: float
    yield_per_acre: float
    expected_revenue_per_acre: float
    worst_case_revenue_per_acre: float
    expected_revenue_total: float
    worst_case_revenue_total: float
    cvi: float
    risk_level: str
    confidence: float


class MarketPrediction(BaseModel):
    per_crop: List[MarketCropPrediction]
    overall_cvi: float
    recommended_market_crop: Optional[str]


class FeatureContribution(BaseModel):
    feature: str
    value: float
    impact: float


class ExplainabilityPayload(BaseModel):
    method: Literal["shap_tree_explainer", "surrogate_zscore"]
    top_crop: str
    summary: str
    feature_contributions: List[FeatureContribution]


class RecommendationResponse(BaseModel):
    success: bool = True
    input_source: Literal["gemini_inferred", "openai_inferred", "heuristic_fallback"]
    location: str
    acres: float
    normalized_features: SoilFeatures
    top_crops: List[CropPrediction]
    market_prediction: MarketPrediction
    explainability: ExplainabilityPayload
    extraction_notes: List[str] = Field(default_factory=list)
    model_info: Dict[str, str]


class SchemeSuggestion(BaseModel):
    id: str
    name: str
    description: str
    benefit: str
    eligibility_hint: str
    eligible: bool
    score: float
    link: str


class AssistantChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    message: str = Field(..., min_length=2)
    language: Literal["en", "hi", "te"] = "en"
    location: str = "India"
    acres: float = Field(default=1.0, gt=0)
    crop: Optional[str] = None


class PolicyEvidence(BaseModel):
    scheme_id: str
    title: str
    snippet: str
    source: str
    score: float


class AssistantChatResponse(BaseModel):
    success: bool = True
    language: Literal["en", "hi", "te"]
    intent: str
    rag_backend: str
    reply: str
    schemes: List[SchemeSuggestion]
    evidence: List[PolicyEvidence]
