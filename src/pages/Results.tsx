import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockResults } from '@/lib/mockData';
import { Volume2, Sprout, AlertTriangle, CloudRain, IndianRupee, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import Footer from '@/components/Footer';

const RiskGauge = ({ score }: { score: number }) => {
  const angle = (score / 100) * 180 - 90;
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
  const data = mockResults;

  useEffect(() => {
    if (!isLoggedIn) navigate('/auth');
  }, [isLoggedIn, navigate]);

  const handleExplainVoice = () => {
    const utterance = new SpeechSynthesisUtterance(data.explanation);
    utterance.rate = 0.9;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

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
                    <Bar dataKey="profit" name="Raw Profit" fill="hsl(122, 47%, 35%)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="adjusted" name="Risk-Adjusted" fill="hsl(122, 40%, 55%)" radius={[6, 6, 0, 0]} />
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
                    <Line type="monotone" dataKey="rice" stroke="hsl(122, 47%, 35%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cotton" stroke="hsl(30, 40%, 50%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="maize" stroke="hsl(45, 70%, 50%)" strokeWidth={2} dot={false} />
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
