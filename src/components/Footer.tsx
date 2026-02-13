import { Sprout } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg mb-2">
          <Sprout className="h-5 w-5" />
          {t('footer.brand')}
        </div>
        <p className="text-muted-foreground text-sm">{t('footer.tagline')}</p>
        <p className="text-muted-foreground/60 text-xs mt-4">© 2025 AgriSage AI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
