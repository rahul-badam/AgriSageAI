import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RecommendationResponse } from '@/lib/api';
import { Volume2, Sprout, AlertTriangle, CloudRain, IndianRupee, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import Footer from '@/components/Footer';

const RiskGauge = ({ score }: { score: number }) => {
  const color = score < 30 ? 'hsl(122, 47%, 35%)' : score < 60 ? 'hsl(40, 80%, 50%)' : 'hsl(0, 84%, 60%)';
  return (
    <div className="relative w-32 h-16 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 141.3} 141.3`}
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-lg font-bold text-foreground">{score}%</div>
    </div>
  );
};

const Results = () => {
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const stateResult = (location.state as { apiResult?: RecommendationResponse } | null)?.apiResult;
  const apiResult = useMemo(() => {
    if (stateResult) return stateResult;
    try {
      const stored = localStorage.getItem('agri_recommendation_result');
      if (!stored) return null;
      return JSON.parse(stored) as RecommendationResponse;
    } catch {
      return null;
    }
  }, [stateResult]);

  useEffect(() => {
    if (!isLoggedIn) navigate('/auth');
  }, [isLoggedIn, navigate]);

  const data = useMemo(() => {
    if (!apiResult) return null;

    const topMarket = apiResult.market_prediction.per_crop[0];
    const topCrop = apiResult.top_crops[0];
    const riskScoreRaw = topMarket?.cvi ?? apiResult.market_prediction.overall_cvi ?? 0;
    const riskScore = Math.max(0, Math.min(100, Math.round(riskScoreRaw)));
    const schemes = apiResult.scheme_suggestions?.length
      ? apiResult.scheme_suggestions.map((scheme) => ({
          name: scheme.name,
          description: scheme.description,
          coverage: scheme.benefit,
          eligible: scheme.eligible,
        }))
      : [
          {
            name: 'PM-KISAN',
            description: 'Direct income support of Rs 6,000/year to small and marginal farmers',
            coverage: 'Income Support',
            eligible: true,
          },
          {
            name: 'PMFBY',
            description: 'Crop insurance at subsidized premium',
            coverage: 'Crop Insurance',
            eligible: true,
          },
        ];

    return {
      recommendedCrop: topCrop?.crop ?? topMarket?.crop ?? 'N/A',
      expectedProfit: Math.round(topMarket?.expected_revenue_per_acre ?? 0),
      riskScore,
      climateVolatilityIndex: Number(apiResult.market_prediction.overall_cvi ?? 0).toFixed(2),
      explanation: `${topCrop?.crop ?? 'This crop'} is recommended for ${apiResult.location} (${apiResult.acres} acres) with ${(
        (topCrop?.confidence ?? 0) * 100
      ).toFixed(1)}% confidence. ${apiResult.explainability.summary}`,
      extractionNotes: apiResult.extraction_notes,
      profitComparison: apiResult.market_prediction.per_crop.map((row) => ({
        crop: row.crop,
        profit: row.expected_revenue_per_acre,
        adjusted: row.worst_case_revenue_per_acre,
      })),
      monteCarloData: Array.from({ length: 20 }, (_, i) => {
        const [a, b, c] = apiResult.market_prediction.per_crop;
        return {
          simulation: i + 1,
          cropA: (a?.expected_revenue_total ?? 0) * (0.9 + (i % 5) * 0.03),
          cropB: (b?.expected_revenue_total ?? 0) * (0.88 + (i % 4) * 0.03),
          cropC: (c?.expected_revenue_total ?? 0) * (0.9 + (i % 3) * 0.04),
        };
      }),
      lineSeries: [
        { key: 'cropA', name: apiResult.market_prediction.per_crop[0]?.crop ?? 'Crop 1', color: 'hsl(122, 47%, 35%)' },
        { key: 'cropB', name: apiResult.market_prediction.per_crop[1]?.crop ?? 'Crop 2', color: 'hsl(30, 40%, 50%)' },
        { key: 'cropC', name: apiResult.market_prediction.per_crop[2]?.crop ?? 'Crop 3', color: 'hsl(45, 70%, 50%)' },
      ],
      schemes,
    };
  }, [apiResult]);

  const handleExplainVoice = () => {
    if (!data) return;
    const utterance = new SpeechSynthesisUtterance(data.explanation);
    utterance.rate = 0.9;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-8">
          <Card className="rounded-2xl shadow-md border-0 max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">No analysis data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Run crop analysis first so results can be generated from backend prediction.
              </p>
              <Button onClick={() => navigate('/analysis')}>Go to Analysis</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">{t('results.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommendation Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl shadow-md border-0 h-full">
              <CardHeader>
                <CardTitle className="text-lg">{t('results.recommendation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sprout className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('results.crop')}</p>
                    <p className="font-semibold text-foreground">{data.recommendedCrop}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('results.profit')}</p>
                    <p className="font-semibold text-foreground">₹{data.expectedProfit.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('results.risk')}</p>
                    <p className="font-semibold text-foreground">{data.riskScore}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CloudRain className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('results.cvi')}</p>
                    <p className="font-semibold text-foreground">{data.climateVolatilityIndex}</p>
                  </div>
                </div>
                <RiskGauge score={data.riskScore} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Profit Comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl shadow-md border-0 h-full">
              <CardHeader>
                <CardTitle className="text-lg">{t('results.profitComparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.profitComparison}>
                    <XAxis dataKey="crop" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="profit" name="Expected" fill="hsl(122, 47%, 35%)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="adjusted" name="Worst Case" fill="hsl(122, 40%, 55%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monte Carlo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-2xl shadow-md border-0 h-full">
              <CardHeader>
                <CardTitle className="text-lg">{t('results.climateRisk')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.monteCarloData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="simulation" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {data.lineSeries.map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Explainable AI */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-2xl shadow-md border-0 h-full">
              <CardHeader>
                <CardTitle className="text-lg">{t('results.explainTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{data.explanation}</p>
                {data.extractionNotes.map((note, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">{note}</p>
                ))}
                <Button variant="outline" className="rounded-xl" onClick={handleExplainVoice}>
                  <Volume2 className="h-4 w-4 mr-2" />
                  {t('results.explainVoice')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Government Schemes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
            <Card className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-lg">{t('results.schemesTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.schemes.map((scheme, i) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground text-sm">{scheme.name}</h4>
                        <Badge variant={scheme.eligible ? 'default' : 'secondary'} className="text-xs">
                          {scheme.eligible ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                          {scheme.eligible ? 'Eligible' : 'Check'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{scheme.description}</p>
                      <Badge variant="outline" className="text-xs">{scheme.coverage}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Results;
