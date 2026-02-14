export type SoilFeatures = {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  ph: number;
};

export type RecommendationRequest = {
  location?: string;
  district?: string;
  state?: string;
  acres?: number;
  land_size?: number;
  landSize?: number;
  season?: string;
  water?: string;
  soil_type?: string;
  soilType?: string;
  language?: 'en' | 'hi' | 'te';
  farmer_input?: string;
  farmerInput?: string;
};

export type TopCrop = {
  crop: string;
  confidence: number;
};

export type MarketCropPrediction = {
  crop: string;
  price_per_quintal: number;
  yield_per_acre: number;
  expected_revenue_per_acre: number;
  worst_case_revenue_per_acre: number;
  expected_revenue_total: number;
  worst_case_revenue_total: number;
  cvi: number;
  risk_level: string;
  confidence: number;
};

export type FeatureContribution = {
  feature: string;
  value: number;
  impact: number;
};

export type AssistantScheme = {
  id: string;
  name: string;
  description: string;
  benefit: string;
  eligibility_hint: string;
  eligible: boolean;
  score: number;
  link: string;
};

export type AssistantEvidence = {
  scheme_id: string;
  title: string;
  snippet: string;
  source: string;
  score: number;
};

export type RecommendationResponse = {
  success: boolean;
  input_source: 'gemini_inferred' | 'openai_inferred' | 'heuristic_fallback';
  location: string;
  acres: number;
  normalized_features: SoilFeatures;
  top_crops: TopCrop[];
  market_prediction: {
    per_crop: MarketCropPrediction[];
    overall_cvi: number;
    recommended_market_crop: string | null;
  };
  explainability: {
    method: 'shap_tree_explainer' | 'surrogate_zscore';
    top_crop: string;
    summary: string;
    feature_contributions: FeatureContribution[];
  };
  extraction_notes: string[];
  model_info: Record<string, string>;
  scheme_suggestions: AssistantScheme[];
};

export type AssistantChatRequest = {
  message: string;
  language: 'en' | 'hi' | 'te';
  location: string;
  acres: number;
  crop?: string;
};

export type AssistantChatResponse = {
  success: boolean;
  language: 'en' | 'hi' | 'te';
  intent: string;
  rag_backend: string;
  reply: string;
  schemes: AssistantScheme[];
  evidence: AssistantEvidence[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function requestCropRecommendation(payload: RecommendationRequest): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok || !data?.success) {
    const message = data?.error ?? 'Failed to fetch recommendation';
    throw new Error(message);
  }

  return data as RecommendationResponse;
}

export async function requestAssistantChat(payload: AssistantChatRequest): Promise<AssistantChatResponse> {
  const response = await fetch(`${API_BASE}/api/v1/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok || !data?.success) {
    const message = data?.error ?? 'Assistant request failed';
    throw new Error(message);
  }

  return data as AssistantChatResponse;
}
