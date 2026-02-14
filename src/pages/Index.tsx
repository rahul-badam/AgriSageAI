import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, TrendingUp, CloudRain, Landmark, BarChart3, Shield, Globe, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-farmer.jpg';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const { t } = useLanguage();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const howItWorks = [
    { icon: Sprout, title: t('how.predictive'), desc: t('how.predictive.desc') },
    { icon: TrendingUp, title: t('how.market'), desc: t('how.market.desc') },
    { icon: CloudRain, title: t('how.climate'), desc: t('how.climate.desc') },
    { icon: Landmark, title: t('how.policy'), desc: t('how.policy.desc') },
  ];

  const impacts = [
    { icon: BarChart3, text: t('impact.simulations') },
    { icon: Shield, text: t('impact.optimization') },
    { icon: Landmark, text: t('impact.planning') },
    { icon: Globe, text: t('impact.support') },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img src={heroImage} alt="Indian farmer in wheat field" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight"
          >
            {t('hero.headline')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            {t('hero.subtext')}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button
              size="lg"
              className="rounded-2xl px-8 py-6 text-base font-semibold shadow-lg"
              onClick={() => navigate(isLoggedIn ? '/analysis' : '/auth')}
            >
              {t('hero.cta')}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">{t('how.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow border-0 bg-card h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {impacts.map((item, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-agri-green-light/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
