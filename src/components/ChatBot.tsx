import { useMemo, useState } from 'react';
import { MessageCircle, X, Send, Sprout, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { requestAssistantChat, type AssistantEvidence, type AssistantScheme } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  text: string;
  isUser: boolean;
  schemes?: AssistantScheme[];
  evidence?: AssistantEvidence[];
  ragBackend?: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { t, language } = useLanguage();
  const { farmer } = useAuth();

  const location = useMemo(() => {
    if (farmer?.district || farmer?.state) {
      return [farmer?.district, farmer?.state].filter(Boolean).join(', ');
    }
    return 'India';
  }, [farmer]);

  const acres = useMemo(() => {
    const value = Number(farmer?.landSize ?? 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }, [farmer]);

  const latestCrop = useMemo(() => {
    try {
      const raw = localStorage.getItem('agri_last_result');
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed?.topCrop as string | undefined;
    } catch {
      return undefined;
    }
  }, [isOpen]);

  const getKnowledgeSourceLabel = (backend?: string) => {
    if (!backend) return null;
    if (backend.toLowerCase() === 'chromadb') return 'Knowledge source: Policy database';
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
    setInput('');
    setIsSending(true);

    try {
      const response = await requestAssistantChat({
        message: userMsg,
        language,
        location,
        acres,
        crop: latestCrop,
      });

      setMessages(prev => [
        ...prev,
        {
          text: response.reply,
          isUser: false,
          schemes: response.schemes,
          evidence: response.evidence,
          ragBackend: response.rag_backend,
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          text: error instanceof Error ? error.message : 'Assistant unavailable right now.',
          isUser: false,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-xl border border-border flex flex-col"
            style={{ maxHeight: '34rem' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary rounded-t-2xl">
              <div className="flex items-center gap-2 text-primary-foreground font-semibold">
                <Sprout className="h-5 w-5" />
                {t('chat.title')}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '18rem' }}>
              {messages.length === 0 && (
                <p className="text-muted-foreground text-sm text-center mt-8">
                  Ask in English, Hindi, or Telugu about schemes, subsidies, insurance, and eligibility.
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-2 text-sm ${
                    msg.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p>{msg.text}</p>
                    {!msg.isUser && msg.schemes?.length ? (
                      <div className="mt-2 space-y-2">
                        {getKnowledgeSourceLabel(msg.ragBackend) ? (
                          <p className="text-[11px] text-muted-foreground">
                            {getKnowledgeSourceLabel(msg.ragBackend)}
                          </p>
                        ) : null}
                        {msg.schemes.slice(0, 3).map((scheme) => (
                          <div key={scheme.id} className="rounded-lg border border-border/60 bg-background/70 p-2 text-xs text-foreground">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">{scheme.name}</span>
                              <span className={scheme.eligible ? 'text-green-600' : 'text-amber-600'}>
                                {scheme.eligible ? 'Eligible' : 'Check'}
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground">{scheme.benefit}</p>
                            <a
                              href={scheme.link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              Open link
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ))}
                        {msg.evidence?.length ? (
                          <div className="rounded-lg border border-border/60 bg-background/60 p-2 text-[11px]">
                            <p className="font-semibold mb-1">Policy evidence</p>
                            {msg.evidence.slice(0, 2).map((item, idx) => (
                              <p key={`${item.scheme_id}-${idx}`} className="text-muted-foreground mb-1">
                                {item.title}: {item.snippet}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {isSending ? <p className="text-xs text-muted-foreground">Thinking...</p> : null}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={t('chat.placeholder')}
                className="flex-1 text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button size="icon" onClick={sendMessage} className="rounded-xl" disabled={isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
};

export default ChatBot;
