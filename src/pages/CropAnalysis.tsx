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

const CropAnalysis = () => {
  const { isLoggedIn, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ district: '', state: '', landSize: '', season: 'Kharif', water: 'Rainfed', soilType: '' });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [listeningField, setListeningField] = useState<string | null>(null);
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

    const acres = Number(form.landSize);
    if (!Number.isFinite(acres) || acres <= 0) {
      setErrorMessage('Please enter a valid land size in acres.');
      return;
    }

    updateProfile({ 
      landSize: form.landSize, 
      soilType: form.soilType,
      lastAnalysisDate: new Date().toLocaleDateString('en-IN')
    });
    
    setLoading(true);
    setLoadingStep(0);

    const loadingInterval = window.setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 700);

    try {
      const location = [form.district.trim(), form.state.trim()].filter(Boolean).join(', ');
      const farmerContext = [
        `Season: ${form.season}`,
        `Water availability: ${form.water}`,
        `Soil type: ${form.soilType.trim()}`,
      ].join('. ');

      const apiResult = await requestCropRecommendation({
        location,
        district: form.district.trim(),
        state: form.state.trim(),
        acres,
        landSize: acres,
        season: form.season,
        water: form.water,
        soilType: form.soilType.trim(),
        language,
        farmer_input: farmerContext,
      });

      localStorage.setItem(
        'agri_last_result',
        JSON.stringify({
          topCrop: apiResult.top_crops?.[0]?.crop ?? null,
          location: apiResult.location,
          acres: apiResult.acres,
          timestamp: Date.now(),
        }),
      );
      localStorage.setItem('agri_recommendation_result', JSON.stringify(apiResult));

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
      setErrorMessage(err instanceof Error ? err.message : 'Failed to run analysis');
    }
  };

  const handleVoiceInput = (fieldName: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Speech recognition not supported in this browser');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    setListeningField(fieldName);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setListeningField(null);

      if (fieldName === 'district') {
        const districts = ['warangal', 'hyderabad', 'vijayawada', 'guntur', 'nellore', 'karimnagar'];
        const foundDistrict = districts.find(d => text.includes(d));
        if (foundDistrict) {
          setForm(prev => ({ ...prev, district: foundDistrict.charAt(0).toUpperCase() + foundDistrict.slice(1) }));
        } else {
          setForm(prev => ({ ...prev, district: text }));
        }
      } else if (fieldName === 'state') {
        const states = ['telangana', 'andhra pradesh', 'karnataka', 'maharashtra', 'tamil nadu'];
        const foundState = states.find(s => text.includes(s));
        if (foundState) {
          setForm(prev => ({ ...prev, state: foundState.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }));
        } else {
          setForm(prev => ({ ...prev, state: text }));
        }
      } else if (fieldName === 'landSize') {
        const numbers = text.match(/\d+/);
        if (numbers) {
          setForm(prev => ({ ...prev, landSize: numbers[0] }));
        }
      } else if (fieldName === 'season') {
        const seasons = ['kharif', 'rabi', 'zaid'];
        const foundSeason = seasons.find(s => text.includes(s));
        if (foundSeason) {
          setForm(prev => ({ ...prev, season: foundSeason.charAt(0).toUpperCase() + foundSeason.slice(1) }));
        }
      } else if (fieldName === 'water') {
        const waters = ['rainfed', 'borewell', 'canal'];
        const foundWater = waters.find(w => text.includes(w));
        if (foundWater) {
          setForm(prev => ({ ...prev, water: foundWater.charAt(0).toUpperCase() + foundWater.slice(1) }));
        }
      } else if (fieldName === 'soilType') {
        const soilTypes = ['black soil', 'red soil', 'alluvial', 'clay', 'sandy', 'loamy'];
        const foundSoil = soilTypes.find(s => text.includes(s));
        if (foundSoil) {
          setForm(prev => ({ ...prev, soilType: foundSoil.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }));
        } else {
          setForm(prev => ({ ...prev, soilType: text }));
        }
      }
    };

    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);
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
                <div className="relative">
                  <Input 
                    value={form.district} 
                    onChange={e => setForm({ ...form, district: e.target.value })} 
                    required 
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => handleVoiceInput('district')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    disabled={listeningField !== null}
                  >
                    <Mic className={`h-4 w-4 ${listeningField === 'district' ? 'text-primary animate-pulse' : 'text-primary/70'}`} />
                  </button>
                </div>
              </div>

              <div>
                <Label>{t('analysis.state')}</Label>
                <div className="relative">
                  <Input 
                    value={form.state} 
                    onChange={e => setForm({ ...form, state: e.target.value })} 
                    required 
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => handleVoiceInput('state')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    disabled={listeningField !== null}
                  >
                    <Mic className={`h-4 w-4 ${listeningField === 'state' ? 'text-primary animate-pulse' : 'text-primary/70'}`} />
                  </button>
                </div>
              </div>

              <div>
                <Label>{t('auth.landSize')}</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={form.landSize} 
                    onChange={e => setForm({ ...form, landSize: e.target.value })} 
                    required 
                    placeholder="e.g., 5"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => handleVoiceInput('landSize')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    disabled={listeningField !== null}
                  >
                    <Mic className={`h-4 w-4 ${listeningField === 'landSize' ? 'text-primary animate-pulse' : 'text-primary/70'}`} />
                  </button>
                </div>
              </div>

              <div>
                <Label>{t('analysis.season')}</Label>
                <div className="relative">
                  <select
                    value={form.season}
                    onChange={e => setForm({ ...form, season: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring pr-10"
                  >
                    <option value="Kharif">{t('analysis.kharif')}</option>
                    <option value="Rabi">{t('analysis.rabi')}</option>
                    <option value="Zaid">{t('analysis.zaid')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleVoiceInput('season')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    disabled={listeningField !== null}
                  >
                    <Mic className={`h-4 w-4 ${listeningField === 'season' ? 'text-primary animate-pulse' : 'text-primary/70'}`} />
                  </button>
                </div>
              </div>

              <div>
                <Label>{t('analysis.water')}</Label>
                <div className="relative">
                  <select
                    value={form.water}
                    onChange={e => setForm({ ...form, water: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring pr-10"
                  >
                    <option value="Rainfed">{t('analysis.rainfed')}</option>
                    <option value="Borewell">{t('analysis.borewell')}</option>
                    <option value="Canal">{t('analysis.canal')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleVoiceInput('water')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    disabled={listeningField !== null}
                  >
                    <Mic className={`h-4 w-4 ${listeningField === 'water' ? 'text-primary animate-pulse' : 'text-primary/70'}`} />
                  </button>
                </div>
              </div>

              <div>
                <Label>Soil Type</Label>
                <div className="relative">
                  <Input 
                    value={form.soilType} 
                    onChange={e => setForm({ ...form, soilType: e.target.value })} 
                    required 
                    placeholder="e.g., Black Soil, Red Soil, Alluvial"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => handleVoiceInput('soilType')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    disabled={listeningField !== null}
                  >
                    <Mic className={`h-4 w-4 ${listeningField === 'soilType' ? 'text-primary animate-pulse' : 'text-primary/70'}`} />
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl py-5 text-base font-semibold">
                {t('analysis.run')}
              </Button>
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CropAnalysis;
