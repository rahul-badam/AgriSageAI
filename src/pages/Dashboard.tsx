import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MapPin, Phone, Ruler, ArrowRight } from 'lucide-react';
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

  return (
    <div className="min-h-[calc(100vh-4rem)]">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ruler className="h-4 w-4" /> {farmer.landSize || 'N/A'} Acres
              </div>
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
