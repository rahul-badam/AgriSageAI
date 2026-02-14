from __future__ import annotations

import logging
from typing import Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend import config
from backend.schemas import (
    AssistantChatRequest,
    AssistantChatResponse,
    CropPrediction,
    ExplainabilityPayload,
    FeatureContribution,
    MarketCropPrediction,
    MarketPrediction,
    PolicyEvidence,
    RecommendationRequest,
    RecommendationResponse,
    SchemeSuggestion,
    SoilFeatures,
)
from backend.services.llm_parser import infer_features_from_context
from backend.services.market_service import MarketService
from backend.services.model_service import CropModelService, FEATURE_ORDER
from backend.services.policy_rag_service import PolicyRAGService
from backend.services.scheme_service import build_reply, find_relevant_schemes, normalize_language

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=config.APP_NAME, version=config.APP_VERSION)

origins = config.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_service = CropModelService(config.MODEL_PATH, config.MODELS_DIR / "Crop_recommendation.csv")
market_service = MarketService(config.BRAIN_PATH)
policy_rag_service = PolicyRAGService(
    docs_path=config.BASE_DIR / "backend" / "data" / "policy_docs.json",
    persist_dir=config.BASE_DIR / "backend" / "chroma_store",
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first_error = exc.errors()[0] if exc.errors() else {}
    message = str(first_error.get("msg", "Invalid request payload"))
    return JSONResponse(status_code=422, content={"success": False, "error": message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(status_code=500, content={"success": False, "error": "Internal server error"})


@app.get("/")
def root() -> Dict[str, str]:
    return {"service": config.APP_NAME, "version": config.APP_VERSION, "status": "ok"}


@app.get(f"{config.API_PREFIX}/health")
def health() -> Dict[str, str]:
    return {
        "status": "ok",
        "model_path": str(config.MODEL_PATH),
        "brain_path": str(config.BRAIN_PATH),
        "gemini_enabled": "yes" if config.GEMINI_API_KEY else "no",
        "model_backend": "dataset_fallback" if model_service.using_fallback else "pickle_model",
        "rag_backend": policy_rag_service.backend,
    }


@app.post(f"{config.API_PREFIX}/recommend", response_model=RecommendationResponse)
def recommend(payload: RecommendationRequest) -> RecommendationResponse:
    location = payload.resolved_location()
    acres = payload.resolved_acres()
    farmer_input = payload.merged_farmer_input()

    features, notes, source = infer_features_from_context(
        location=location,
        acres=acres,
        farmer_input=farmer_input,
    )

    if farmer_input:
        notes.append("Used structured farmer context from request payload.")

    try:
        predictions = model_service.predict_top_k(features, k=3)
    except Exception as exc:
        logger.exception("Prediction failed: %s", exc)
        raise HTTPException(status_code=500, detail="Model prediction failed") from exc

    top_crops = [CropPrediction(crop=pred.crop, confidence=round(pred.confidence, 4)) for pred in predictions]
    top_crop = top_crops[0].crop if top_crops else "unknown"

    explanation = model_service.explain_top_crop(features, top_crop)

    market_dict = market_service.build_market_predictions(
        top_crops=[{"crop": c.crop, "confidence": c.confidence} for c in top_crops],
        features=features,
        acres=acres,
    )

    market_prediction = MarketPrediction(
        per_crop=[MarketCropPrediction(**row) for row in market_dict["per_crop"]],
        overall_cvi=float(market_dict["overall_cvi"]),
        recommended_market_crop=market_dict["recommended_market_crop"],
    )

    explainability = ExplainabilityPayload(
        method=explanation.method,
        top_crop=explanation.top_crop,
        summary=explanation.summary,
        feature_contributions=[
            FeatureContribution(feature=c.feature, value=c.value, impact=c.impact)
            for c in explanation.feature_contributions
        ],
    )

    language = normalize_language(payload.language)
    scheme_query = " ".join(
        part
        for part in [
            farmer_input,
            f"crop {top_crop}" if top_crop and top_crop != "unknown" else "",
            "government scheme subsidy insurance credit irrigation",
        ]
        if part
    )

    schemes, _ = find_relevant_schemes(
        query=scheme_query,
        location=location,
        acres=acres,
        crop=top_crop if top_crop and top_crop != "unknown" else None,
        language=language,
        rag_hits=[],
        limit=4,
    )

    return RecommendationResponse(
        input_source=source,
        location=location,
        acres=acres,
        normalized_features=SoilFeatures(**{k: float(features[k]) for k in FEATURE_ORDER}),
        top_crops=top_crops,
        market_prediction=market_prediction,
        explainability=explainability,
        extraction_notes=notes,
        model_info={
            "model_path": str(config.MODEL_PATH),
            "brain_path": str(config.BRAIN_PATH),
            "feature_order": ",".join(FEATURE_ORDER),
            "model_backend": "dataset_fallback" if model_service.using_fallback else "pickle_model",
        },
        scheme_suggestions=[SchemeSuggestion(**item) for item in schemes],
    )


@app.post(f"{config.API_PREFIX}/assistant/chat", response_model=AssistantChatResponse)
def assistant_chat(payload: AssistantChatRequest) -> AssistantChatResponse:
    language = normalize_language(payload.language)

    rag_hits = policy_rag_service.query(payload.message, top_k=5)

    schemes, intent = find_relevant_schemes(
        query=payload.message,
        location=payload.location,
        acres=float(payload.acres),
        crop=payload.crop,
        language=language,
        rag_hits=rag_hits,
        limit=3,
    )

    reply = build_reply(
        query=payload.message,
        location=payload.location,
        acres=float(payload.acres),
        crop=payload.crop,
        language=language,
        schemes=schemes,
        intent=intent,
    )

    evidence = [
        PolicyEvidence(
            scheme_id=str(hit.get("scheme_id", "")),
            title=str(hit.get("title", "")),
            snippet=str(hit.get("snippet", "")),
            source=str(hit.get("source", "")),
            score=float(hit.get("score", 0.0)),
        )
        for hit in rag_hits[:3]
        if str(hit.get("scheme_id", "")).strip()
    ]

    return AssistantChatResponse(
        language=language,
        intent=intent,
        rag_backend=policy_rag_service.backend,
        reply=reply,
        schemes=[SchemeSuggestion(**item) for item in schemes],
        evidence=evidence,
    )
