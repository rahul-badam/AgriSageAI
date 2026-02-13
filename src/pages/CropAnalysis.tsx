import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Mic, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '@/components/Footer';

const CropAnalysis = () => {
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ district: '', state: '', season: 'Kharif', water: 'Rainfed', nitrogen: 50 });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate('/auth');
  }, [isLoggedIn, navigate]);

  const loadingMessages = [
    t('loading.predictive'),
    t('loading.climate'),
    t('loading.market'),
    t('loading.schemes'),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= 4) {
        clearInterval(interval);
        setTimeout(() => navigate('/results'), 800);
      } else {
        setLoadingStep(step);
      }
    }, 1200);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Speech recognition not supported in this browser');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    setListening(true);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setListening(false);

      // Parse spoken input
      const districts = ['warangal', 'hyderabad', 'vijayawada', 'guntur', 'nellore', 'karimnagar'];
      const seasons = ['kharif', 'rabi', 'zaid'];
      const waters = ['rainfed', 'borewell', 'canal'];

      const foundDistrict = districts.find(d => text.includes(d));
      const foundSeason = seasons.find(s => text.includes(s));
      const foundWater = waters.find(w => text.includes(w));

      setForm(prev => ({
        ...prev,
        ...(foundDistrict && { district: foundDistrict.charAt(0).toUpperCase() + foundDistrict.slice(1) }),
        ...(foundSeason && { season: foundSeason.charAt(0).toUpperCase() + foundSeason.slice(1) }),
        ...(foundWater && { water: foundWater.charAt(0).toUpperCase() + foundWater.slice(1) }),
      }));
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-secondary/20">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg font-medium text-foreground"
            >
              {loadingMessages[loadingStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="rounded-2xl shadow-lg border border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-foreground">{t('analysis.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>{t('analysis.district')}</Label>
                <Input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} required />
              </div>
              <div>
                <Label>{t('analysis.state')}</Label>
                <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} required />
              </div>
              <div>
                <Label>{t('analysis.season')}</Label>
                <select
                  value={form.season}
                  onChange={e => setForm({ ...form, season: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Kharif">{t('analysis.kharif')}</option>
                  <option value="Rabi">{t('analysis.rabi')}</option>
                  <option value="Zaid">{t('analysis.zaid')}</option>
                </select>
              </div>
              <div>
                <Label>{t('analysis.water')}</Label>
                <select
                  value={form.water}
                  onChange={e => setForm({ ...form, water: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Rainfed">{t('analysis.rainfed')}</option>
                  <option value="Borewell">{t('analysis.borewell')}</option>
                  <option value="Canal">{t('analysis.canal')}</option>
                </select>
              </div>
              <div>
                <Label>{t('analysis.nitrogen')}: {form.nitrogen}</Label>
                <Slider
                  value={[form.nitrogen]}
                  onValueChange={([v]) => setForm({ ...form, nitrogen: v })}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={handleVoiceInput}
                disabled={listening}
              >
                <Mic className={`h-4 w-4 mr-2 ${listening ? 'text-destructive animate-pulse' : ''}`} />
                {listening ? 'Listening...' : t('analysis.speak')}
              </Button>

              <Button type="submit" className="w-full rounded-xl py-5 text-base font-semibold">
                {t('analysis.run')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CropAnalysis;
