from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator

TELANGANA_STATE = "Telangana"

ALLOWED_TELANGANA_DISTRICTS = {
    "adilabad": "Adilabad",
    "bhadradri kothagudem": "Bhadradri Kothagudem",
    "hanamkonda": "Hanamkonda",
    "hyderabad": "Hyderabad",
    "jagtial": "Jagtial",
    "jangaon": "Jangaon",
    "jayashankar bhupalpally": "Jayashankar Bhupalpally",
    "jogulamba gadwal": "Jogulamba Gadwal",
    "kamareddy": "Kamareddy",
    "karimnagar": "Karimnagar",
    "khammam": "Khammam",
    "komaram bheem asifabad": "Komaram Bheem Asifabad",
    "mahabubabad": "Mahabubabad",
    "mahabubnagar": "Mahabubnagar",
    "mancherial": "Mancherial",
    "medak": "Medak",
    "medchal malkajgiri": "Medchal Malkajgiri",
    "mulugu": "Mulugu",
    "nagarkurnool": "Nagarkurnool",
    "nalgonda": "Nalgonda",
    "narayanpet": "Narayanpet",
    "nirmal": "Nirmal",
    "nizamabad": "Nizamabad",
    "peddapalli": "Peddapalli",
    "rajanna sircilla": "Rajanna Sircilla",
    "rangareddy": "Rangareddy",
    "sangareddy": "Sangareddy",
    "siddipet": "Siddipet",
    "suryapet": "Suryapet",
    "vikarabad": "Vikarabad",
    "wanaparthy": "Wanaparthy",
    "warangal": "Warangal",
    "yadadri bhuvanagiri": "Yadadri Bhuvanagiri",
}

ALLOWED_SOIL_TYPES = {
    "black soil": "Black Soil",
    "red soil": "Red Soil",
    "alluvial": "Alluvial",
    "clay": "Clay",
    "sandy": "Sandy",
    "loamy": "Loamy",
}


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

    location: Optional[str] = Field(default=None, min_length=2, description="District, state, or region")
    district: Optional[str] = Field(default=None, min_length=2)
    state: Optional[str] = Field(default=None, min_length=2)
    acres: Optional[float] = Field(default=None, gt=0, description="Farm size in acres")
    land_size: Optional[float] = Field(
        default=None,
        gt=0,
        validation_alias=AliasChoices("land_size", "landSize", "landsize"),
        description="Farm size in acres",
    )
    season: Optional[str] = None
    water: Optional[str] = Field(default=None, validation_alias=AliasChoices("water", "water_source", "waterSource"))
    soil_type: Optional[str] = Field(default=None, validation_alias=AliasChoices("soil_type", "soilType"))
    language: Literal["en", "hi", "te"] = "en"
    farmer_input: str = Field(
        default="",
        validation_alias=AliasChoices("farmer_input", "farmer_text", "farmerInput"),
        description="Voice transcript or typed farmer context",
    )

    @staticmethod
    def _clean_text(value: Optional[str]) -> str:
        return value.strip() if isinstance(value, str) else ""

    @staticmethod
    def _norm(value: str) -> str:
        return " ".join(value.strip().lower().split())

    def _resolved_district_state(self) -> tuple[str, str]:
        district = self._clean_text(self.district)
        state = self._clean_text(self.state)
        location = self._clean_text(self.location)

        if location:
            parts = [part.strip() for part in location.split(",") if part.strip()]
            if len(parts) >= 2:
                if not district:
                    district = parts[0]
                if not state:
                    state = parts[-1]

        return district, state

    def _resolved_location(self) -> str:
        direct_location = self._clean_text(self.location)
        if direct_location:
            return direct_location
        district = self._clean_text(self.district)
        state = self._clean_text(self.state)
        return ", ".join(part for part in [district, state] if part)

    def _resolved_acres(self) -> Optional[float]:
        if self.acres is not None and self.acres > 0:
            return float(self.acres)
        if self.land_size is not None and self.land_size > 0:
            return float(self.land_size)
        return None

    @model_validator(mode="after")
    def validate_required_inputs(self) -> "RecommendationRequest":
        if not self._resolved_location():
            raise ValueError("location or district/state is required")
        if self._resolved_acres() is None:
            raise ValueError("acres or landSize is required")

        district_raw, state_raw = self._resolved_district_state()
        if not district_raw:
            raise ValueError("Wrong type: district is required")

        state_norm = self._norm(state_raw) if state_raw else ""
        if state_norm and state_norm != "telangana":
            raise ValueError("Wrong type: state must be Telangana")

        district_norm = self._norm(district_raw)
        if district_norm not in ALLOWED_TELANGANA_DISTRICTS:
            allowed = ", ".join(ALLOWED_TELANGANA_DISTRICTS.values())
            raise ValueError(f"Wrong type: district must be one of Telangana districts ({allowed})")

        soil_type_raw = self._clean_text(self.soil_type)
        if soil_type_raw:
            soil_norm = self._norm(soil_type_raw)
            if soil_norm not in ALLOWED_SOIL_TYPES:
                allowed_soils = ", ".join(ALLOWED_SOIL_TYPES.values())
                raise ValueError(f"Wrong type: soil type must be one of ({allowed_soils})")
            self.soil_type = ALLOWED_SOIL_TYPES[soil_norm]

        self.district = ALLOWED_TELANGANA_DISTRICTS[district_norm]
        self.state = TELANGANA_STATE
        self.location = f"{self.district}, {self.state}"
        return self

    def resolved_location(self) -> str:
        return self._resolved_location() or "India"

    def resolved_acres(self) -> float:
        acres = self._resolved_acres()
        return float(acres) if acres is not None else 1.0

    def merged_farmer_input(self) -> str:
        notes = []

        free_text = self._clean_text(self.farmer_input)
        if free_text:
            notes.append(free_text)

        season = self._clean_text(self.season)
        if season:
            notes.append(f"Season: {season}")

        water = self._clean_text(self.water)
        if water:
            notes.append(f"Water availability: {water}")

        soil_type = self._clean_text(self.soil_type)
        if soil_type:
            notes.append(f"Soil type: {soil_type}")

        return ". ".join(notes)


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


class SchemeSuggestion(BaseModel):
    id: str
    name: str
    description: str
    benefit: str
    eligibility_hint: str
    eligible: bool
    score: float
    link: str


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
    scheme_suggestions: List[SchemeSuggestion] = Field(default_factory=list)


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
