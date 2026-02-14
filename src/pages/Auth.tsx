import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Sprout } from 'lucide-react';

type AuthTab = 'register' | 'login';

const Auth = () => {
  const { isLoaded, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialTab = useMemo<AuthTab>(
    () => (searchParams.get('mode') === 'signup' ? 'register' : 'login'),
    [searchParams],
  );
  const [tab, setTab] = useState<AuthTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isLoaded && isLoggedIn) navigate('/dashboard');
  }, [isLoaded, isLoggedIn, navigate]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-agri-green-light/40">
      <div className="pointer-events-none absolute -top-32 -left-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg rounded-3xl border border-primary/20 bg-card/90 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sprout className="h-7 w-7" />
            </div>
            <CardTitle className="text-3xl text-primary">AgriSage AI</CardTitle>
            <p className="text-sm text-muted-foreground">Secure email access for your farm insights</p>
          </CardHeader>
          <CardContent>
            <div className="mb-5 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                Sign in with your email address
              </div>
            </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as AuthTab)}>
              <TabsList className="mb-6 w-full rounded-xl bg-secondary/50 p-1">
                <TabsTrigger value="register" className="flex-1 rounded-lg">
                  {t('auth.register')}
                </TabsTrigger>
                <TabsTrigger value="login" className="flex-1 rounded-lg">
                  {t('auth.login')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <SignIn
                  routing="virtual"
                  signUpUrl="/auth?mode=signup"
                  initialValues={{ emailAddress: '' }}
                  fallbackRedirectUrl="/dashboard"
                  forceRedirectUrl="/dashboard"
                  appearance={{
                    elements: {
                      card: 'shadow-none border-0 bg-transparent',
                      rootBox: 'w-full',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: 'rounded-xl',
                      formButtonPrimary: 'rounded-xl',
                      formFieldInput: 'rounded-xl',
                      footerActionLink: 'text-primary',
                    },
                  }}
                />
              </TabsContent>

              <TabsContent value="register">
                <SignUp
                  routing="virtual"
                  signInUrl="/auth?mode=login"
                  initialValues={{ emailAddress: '' }}
                  fallbackRedirectUrl="/dashboard"
                  forceRedirectUrl="/dashboard"
                  appearance={{
                    elements: {
                      card: 'shadow-none border-0 bg-transparent',
                      rootBox: 'w-full',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: 'rounded-xl',
                      formButtonPrimary: 'rounded-xl',
                      formFieldInput: 'rounded-xl',
                      footerActionLink: 'text-primary',
                    },
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
