import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MapPin, Phone, Ruler, ArrowRight, TrendingUp, Sprout } from 'lucide-react';
import { useEffect } from 'react';
import Footer from '@/components/Footer';

const Dashboard = () => {
  const { farmer, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate('/auth');
  }, [isLoggedIn, navigate]);

  if (!farmer) return null;

  const highDemandCrops = [
    { name: 'Rice (Paddy)', price: '₹2,100/quintal', trend: '+5%' },
    { name: 'Cotton', price: '₹6,800/quintal', trend: '+8%' },
    { name: 'Wheat', price: '₹2,125/quintal', trend: '+3%' },
  ];

  const upcomingDemandCrops = [
    { name: 'Maize', forecast: 'High demand expected', season: 'Next Kharif' },
    { name: 'Pulses', forecast: 'Growing market interest', season: 'Next Rabi' },
    { name: 'Soybean', forecast: 'Export orders rising', season: 'Kharif 2025' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Marketplace Bar */}
      <div className="bg-gradient-to-r from-agri-green-light to-secondary/30 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High Demand Crops */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sprout className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">High Demand Now</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {highDemandCrops.map((crop, i) => (
                  <div key={i} className="bg-card rounded-xl p-3 shadow-sm border border-border/50">
                    <p className="font-medium text-foreground text-sm mb-1">{crop.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{crop.price}</span>
                      <span className="text-xs font-medium text-primary">{crop.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Demand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Projected Demand</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {upcomingDemandCrops.map((crop, i) => (
                  <div key={i} className="bg-card rounded-xl p-3 shadow-sm border border-border/50">
                    <p className="font-medium text-foreground text-sm mb-1">{crop.name}</p>
                    <p className="text-xs text-muted-foreground mb-0.5">{crop.forecast}</p>
                    <span className="text-xs text-accent/70">{crop.season}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
          {t('dash.welcome')}, {farmer.name} 👋
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="rounded-2xl shadow-md border-0 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t('dash.profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" /> {farmer.phone || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {farmer.district || 'N/A'}, {farmer.state || 'N/A'}
              </div>
              {farmer.landSize && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ruler className="h-4 w-4" /> {farmer.landSize} Acres
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Action */}
          <Card className="rounded-2xl shadow-md border-0 lg:col-span-2 flex items-center">
            <CardContent className="p-8 w-full">
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('dash.startAnalysis')}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t('dash.noAnalyses')}</p>
              <Button className="rounded-xl" onClick={() => navigate('/analysis')}>
                {t('dash.startAnalysis')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
