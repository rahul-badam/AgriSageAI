export const mockResults = {
  recommendedCrop: 'Rice (Paddy)',
  expectedProfit: 42500,
  riskScore: 32,
  climateVolatilityIndex: 0.45,
  explanation: `Rice is recommended based on your district's soil composition (high nitrogen content), favorable monsoon patterns for the Kharif season, and strong market demand. The risk-adjusted analysis shows that despite moderate climate volatility, the expected returns outperform alternative crops by 18%. Historical yield data from your region supports this recommendation with 85% confidence. The current MSP (Minimum Support Price) provides a safety net, reducing downside risk significantly.`,
  profitComparison: [
    { crop: 'Rice', profit: 42500, risk: 32, adjusted: 38900 },
    { crop: 'Cotton', profit: 38000, risk: 48, adjusted: 30400 },
    { crop: 'Maize', profit: 35000, risk: 28, adjusted: 33600 },
  ],
  monteCarloData: Array.from({ length: 20 }, (_, i) => ({
    simulation: i + 1,
    rice: 35000 + Math.random() * 15000,
    cotton: 28000 + Math.random() * 20000,
    maize: 30000 + Math.random() * 10000,
  })),
  schemes: [
    {
      name: 'PM-KISAN',
      description: 'Direct income support of ₹6,000/year to small & marginal farmers',
      coverage: 'Income Support',
      eligible: true,
    },
    {
      name: 'PMFBY',
      description: 'Pradhan Mantri Fasal Bima Yojana – Crop insurance at subsidized premiums',
      coverage: 'Crop Insurance',
      eligible: true,
    },
    {
      name: 'Soil Health Card Scheme',
      description: 'Free soil testing and nutrient-based recommendations for farmers',
      coverage: 'Soil Health',
      eligible: true,
    },
    {
      name: 'Kisan Credit Card',
      description: 'Short-term credit for crop production at subsidized interest rates',
      coverage: 'Credit Access',
      eligible: false,
    },
  ],
};

export const chatResponses: Record<string, string> = {
  'why is this crop risky': 'The crop risk is primarily driven by climate volatility in your region. Irregular monsoon patterns and temperature variations can impact yields. However, the risk-adjusted model accounts for these factors and still recommends this crop for optimal returns.',
  'tell me more about pmfby': 'PMFBY (Pradhan Mantri Fasal Bima Yojana) provides crop insurance to farmers at very low premiums – just 2% for Kharif and 1.5% for Rabi crops. It covers losses from natural calamities, pests, and diseases. You can enroll through your bank or Common Service Centre.',
  'how does rainfall affect profit': 'Rainfall directly impacts crop yield and water availability. Our Monte Carlo simulation models various rainfall scenarios to predict profit variability. In your region, a 10% decrease in rainfall could reduce rice yields by approximately 15%, while excess rainfall may cause waterlogging risks.',
  'default': 'Thank you for your question! As an AI agricultural advisor, I can help with crop recommendations, government schemes, climate risks, and market analysis. Please ask me about specific topics related to your farming needs.',
};
