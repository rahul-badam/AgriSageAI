import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { Sprout, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { farmer, logout, isLoggedIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
              <div 
                className="relative"
                onMouseEnter={() => setShowProfileDropdown(true)}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <div className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer hover:text-primary transition-colors">
                  <User className="h-4 w-4" />
                  {farmer?.name}
                </div>
                
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border border-border p-4 space-y-2"
                    >
                      <div className="pb-2 border-b border-border">
                        <p className="font-semibold text-foreground">{farmer?.name}</p>
                        <p className="text-xs text-muted-foreground">{farmer?.phone}</p>
                      </div>
                      {farmer?.district && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">District: </span>
                          <span className="text-foreground font-medium">{farmer.district}</span>
                        </div>
                      )}
                      {farmer?.state && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">State: </span>
                          <span className="text-foreground font-medium">{farmer.state}</span>
                        </div>
                      )}
                      {farmer?.landSize && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Land Size: </span>
                          <span className="text-foreground font-medium">{farmer.landSize} Acres</span>
                        </div>
                      )}
                      {farmer?.soilType && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Soil Type: </span>
                          <span className="text-foreground font-medium">{farmer.soilType}</span>
                        </div>
                      )}
                      {farmer?.lastAnalysisDate && (
                        <div className="text-sm pt-2 border-t border-border">
                          <span className="text-muted-foreground">Last Analysis: </span>
                          <span className="text-foreground font-medium">{farmer.lastAnalysisDate}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
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
              
              {/* Mobile Profile Info */}
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <p className="font-semibold text-foreground text-sm">{farmer?.name}</p>
                {farmer?.district && (
                  <p className="text-xs text-muted-foreground">District: {farmer.district}</p>
                )}
                {farmer?.state && (
                  <p className="text-xs text-muted-foreground">State: {farmer.state}</p>
                )}
                {farmer?.landSize && (
                  <p className="text-xs text-muted-foreground">Land Size: {farmer.landSize} Acres</p>
                )}
                {farmer?.soilType && (
                  <p className="text-xs text-muted-foreground">Soil Type: {farmer.soilType}</p>
                )}
                {farmer?.lastAnalysisDate && (
                  <p className="text-xs text-muted-foreground">Last Analysis: {farmer.lastAnalysisDate}</p>
                )}
              </div>
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
