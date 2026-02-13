import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { Sprout, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Navbar = () => {
  const { farmer, logout, isLoggedIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Sprout className="h-6 w-6" />
          AgriSage AI
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-foreground/70 hover:text-primary transition-colors text-sm font-medium">
            {t('nav.home')}
          </Link>
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className="text-foreground/70 hover:text-primary transition-colors text-sm font-medium">
                {t('nav.dashboard')}
              </Link>
              <Link to="/analysis" className="text-foreground/70 hover:text-primary transition-colors text-sm font-medium">
                {t('nav.analysis')}
              </Link>
            </>
          )}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-sm border border-border rounded-lg px-2 py-1 bg-card text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="te">తెలుగు</option>
          </select>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <User className="h-4 w-4" />
                {farmer?.name}
              </div>
              <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')}>
              {t('nav.login')}
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-b border-border p-4 space-y-3">
          <Link to="/" className="block text-foreground/70 hover:text-primary" onClick={() => setMobileOpen(false)}>
            {t('nav.home')}
          </Link>
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className="block text-foreground/70 hover:text-primary" onClick={() => setMobileOpen(false)}>
                {t('nav.dashboard')}
              </Link>
              <Link to="/analysis" className="block text-foreground/70 hover:text-primary" onClick={() => setMobileOpen(false)}>
                {t('nav.analysis')}
              </Link>
            </>
          )}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-sm border border-border rounded-lg px-2 py-1 bg-card w-full"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="te">తెలుగు</option>
          </select>
          {isLoggedIn ? (
            <Button variant="outline" size="sm" className="w-full" onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}>
              {t('nav.logout')}
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={() => { navigate('/auth'); setMobileOpen(false); }}>
              {t('nav.login')}
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
