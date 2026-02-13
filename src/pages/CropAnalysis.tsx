import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mic, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestCropRecommendation } from '@/lib/api';
import Footer from '@/components/Footer';

type AnalysisForm = {
  location: string;
  acres: number;
  farmerInput: string;
};

const CropAnalysis = () => {
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState<AnalysisForm>({
    location: '',
    acres: 1,
    farmerInput: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoggedIn) navigate('/auth');
  }, [isLoggedIn, navigate]);

  const loadingMessages = [
    t('loading.predictive'),
    t('loading.climate'),
    t('loading.market'),
    t('loading.schemes'),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    setLoadingStep(0);

    const loadingInterval = window.setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 700);

    try {
      const apiResult = await requestCropRecommendation({
        location: form.location.trim(),
        acres: Number(form.acres),
        farmer_input: form.farmerInput.trim(),
      });

      localStorage.setItem(
        'agri_last_result',
        JSON.stringify({
          topCrop: apiResult.top_crops?.[0]?.crop ?? null,
          location: apiResult.location,
          acres: apiResult.acres,
          timestamp: Date.now(),
        })
      );

      window.clearInterval(loadingInterval);
      setLoading(false);
      navigate('/results', {
        state: {
          apiResult,
        },
      });
    } catch (err) {
      window.clearInterval(loadingInterval);
      setLoading(false);
      setLoadingStep(0);
      setErrorMessage(err instanceof Error ? err.message : 'Prediction failed');
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    setListening(true);
    setErrorMessage('');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      setForm((prev) => ({ ...prev, farmerInput: transcript }));
    };

    recognition.onerror = () => {
      setListening(false);
      setErrorMessage('Voice capture failed. Please try again.');
    };
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
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Card className="rounded-2xl shadow-lg border border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-foreground">{t('analysis.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Location</Label>
                <Input
                  placeholder="District, State (e.g., Warangal, Telangana)"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>No. of acres</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.acres}
                  onChange={e => setForm({ ...form, acres: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label>Voice or text farmer input (optional)</Label>
                <Input
                  placeholder="Example: I have red soil, usually moderate rain, planning Kharif"
                  value={form.farmerInput}
                  onChange={e => setForm({ ...form, farmerInput: e.target.value })}
                />
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

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
