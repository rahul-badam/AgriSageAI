import { useState } from 'react';
import { MessageCircle, X, Send, Sprout } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatResponses } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  text: string;
  isUser: boolean;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { t } = useLanguage();

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
    setInput('');

    const key = Object.keys(chatResponses).find(k => userMsg.toLowerCase().includes(k));
    const response = key ? chatResponses[key] : chatResponses['default'];

    setTimeout(() => {
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    }, 600);
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
            style={{ maxHeight: '28rem' }}
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

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '16rem' }}>
              {messages.length === 0 && (
                <p className="text-muted-foreground text-sm text-center mt-8">
                  Ask me about crops, schemes, risks...
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={t('chat.placeholder')}
                className="flex-1 text-sm rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button size="icon" onClick={sendMessage} className="rounded-xl">
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
