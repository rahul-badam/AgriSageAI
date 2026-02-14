import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Auth = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [registerForm, setRegisterForm] = useState({ name: '', phone: '', district: '', state: '' });
  const [loginForm, setLoginForm] = useState({ name: '', phone: '' });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.name && registerForm.phone) {
      login(registerForm);
      navigate('/dashboard');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.name && loginForm.phone) {
      login({ ...loginForm, district: '', state: '' });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-secondary/20">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">AgriSage AI</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="register">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="register" className="flex-1">{t('auth.register')}</TabsTrigger>
              <TabsTrigger value="login" className="flex-1">{t('auth.login')}</TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label>{t('auth.name')}</Label>
                  <Input value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} required />
                </div>
                <div>
                  <Label>{t('auth.phone')}</Label>
                  <Input type="tel" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('auth.district')}</Label>
                    <Input value={registerForm.district} onChange={e => setRegisterForm({ ...registerForm, district: e.target.value })} />
                  </div>
                  <div>
                    <Label>{t('auth.state')}</Label>
                    <Input value={registerForm.state} onChange={e => setRegisterForm({ ...registerForm, state: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl">{t('auth.submit')}</Button>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>{t('auth.name')}</Label>
                  <Input value={loginForm.name} onChange={e => setLoginForm({ ...loginForm, name: e.target.value })} required />
                </div>
                <div>
                  <Label>{t('auth.phone')}</Label>
                  <Input type="tel" value={loginForm.phone} onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full rounded-xl">{t('auth.submit')}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
