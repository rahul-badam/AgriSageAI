import os
import json
import logging
import typing
from contextlib import asynccontextmanager

import joblib
import pandas as pd
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# --- Configuration & Setup ---

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in environment variables.")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global Model Variable
ml_model = None
MODEL_PATH = "model_pkl"

# Feature order required by the model
FEATURE_ORDER = ["N", "P", "K", "temperature", "humidity", "rainfall", "ph"]

# --- Lifespan Management (Startup/Shutdown) ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the ML model on startup.
    """
    global ml_model
    try:
        if os.path.exists(MODEL_PATH):
            logger.info(f"Loading model from {MODEL_PATH}...")
            ml_model = joblib.load(MODEL_PATH)
            logger.info("Model loaded successfully.")
        else:
            logger.warning(f"Model file '{MODEL_PATH}' not found. Prediction endpoint will fail if called.")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise e
    
    yield
    
    # Cleanup resources if needed
    ml_model = None

# --- App Initialization ---

app = FastAPI(title="Crop Recommendation API", lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production flexibility (restrict in real prod)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions ---

async def transcribe_audio(file_bytes: bytes, mime_type: str) -> str:
    """
    Step 1: Send audio bytes to Gemini for transcription.
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = (
            "Listen to the following audio and provide a verbatim transcription. "
            "The audio may be in English, Hindi, or Telugu. "
            "Output only the clean transcribed text without timestamps or speaker labels."
        )

        # Gemini SDK supports passing raw bytes for audio
        response = await model.generate_content_async(
            [
                prompt,
                {
                    "mime_type": mime_type,
                    "data": file_bytes
                }
            ]
        )
        
        return response.text.strip()
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=502, detail=f"Gemini Transcription Failed: {str(e)}")


async def extract_features(transcript: str) -> dict:
    """
    Step 2: Extract numeric features from text using Gemini with JSON enforcement.
    """
    try:
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )

        system_prompt = (
            "You are a strict data extractor. Extract numeric values for: "
            "N, P, K, temperature, humidity, rainfall, ph. "
            "Support numbers written in words. Return ONLY strict JSON with: "
            "{ "
            '"N": float or null, '
            '"P": float or null, '
            '"K": float or null, '
            '"temperature": float or null, '
            '"humidity": float or null, '
            '"rainfall": float or null, '
            '"ph": float or null '
            "} "
            "No explanations. No extra text."
        )

        response = await model.generate_content_async([system_prompt, transcript])
        
        # Parse JSON
        data = json.loads(response.text)
        return data
    except json.JSONDecodeError:
        logger.error("Failed to parse JSON from Gemini response")
        raise HTTPException(status_code=502, detail="Failed to parse feature data from AI model.")
    except Exception as e:
        logger.error(f"Feature extraction failed: {e}")
        raise HTTPException(status_code=502, detail=f"Gemini Extraction Failed: {str(e)}")


def predict_crops(features: dict) -> typing.Tuple[list, list]:
    """
    Step 3: Run the ML model prediction.
    Returns (predictions_list, missing_fields_list)
    """
    global ml_model
    
    # 1. Check for missing values (nulls)
    missing_fields = [k for k, v in features.items() if v is None]
    
    # If key fields are missing, we cannot predict
    if missing_fields:
        return [], missing_fields

    if not ml_model:
        raise HTTPException(status_code=503, detail="ML Model is not loaded.")

    try:
        # 2. Prepare DataFrame with exact column order
        # Ensure all keys exist in dictionary before creating DF (though missing_fields check handles nulls)
        input_data = {k: [v] for k, v in features.items()}
        df = pd.DataFrame(input_data)
        
        # Reorder columns strictly
        df = df[FEATURE_ORDER]

        # 3. Predict Probabilities
        if not hasattr(ml_model, "predict_proba"):
            raise ValueError("Loaded model does not support predict_proba")

        probas = ml_model.predict_proba(df)[0]
        classes = ml_model.classes_

        # 4. Get Top 3
        # Create list of (class, probability)
        class_probs = list(zip(classes, probas))
        # Sort by probability descending
        class_probs.sort(key=lambda x: x[1], reverse=True)
        
        top_3 = class_probs[:3]

        # Format output
        predictions = [
            {"crop": cls, "confidence": round(prob * 100, 2)}
            for cls, prob in top_3
        ]

        return predictions, []

    except Exception as e:
        logger.error(f"Prediction logic failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction Engine Failed: {str(e)}")


# --- Endpoints ---

@app.post("/recommend")
async def recommend_crop(file: UploadFile = File(...)):
    """
    Receives an audio file, transcribes it, extracts soil features, 
    and returns crop recommendations.
    """
    
    # Validate file type (basic check)
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file.")

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read file upload.")

    # Step 1: Transcribe
    transcript = await transcribe_audio(file_bytes, file.content_type)
    
    # Step 2: Extract Features
    features_data = await extract_features(transcript)
    
    # Step 3: Predict
    predictions, missing_fields = predict_crops(features_data)

    # Construct Response
    response_payload = {
        "transcript": transcript,
        "features": features_data,
        "missing_fields": missing_fields,
        "predictions": predictions
    }

    return JSONResponse(content=response_payload)

# --- Documentation & Examples ---

"""
ENVIRONMENT VARIABLE SETUP:
1. Create a .env file in the root directory.
2. Add: GEMINI_API_KEY=your_google_api_key_here

CURL REQUEST EXAMPLE:
curl -X POST "http://127.0.0.1:8000/recommend" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/audio_recording.mp3"
"""