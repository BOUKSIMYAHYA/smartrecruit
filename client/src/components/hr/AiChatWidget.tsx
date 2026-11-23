import React, { useState, useRef, useEffect } from 'react';
import { ApiClient } from '../../services/api.js';
import { Sparkles, Send, Bot, User, Loader2, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AiChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Bonjour ! Je suis votre Assistant RH Intelligent. Je suis connecte directement a la base de donnees PostgreSQL de SmartRecruit ATS.\n\nVous pouvez me poser des questions sur les candidats, les offres, les competences ou demander un comparatif.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'Trouve-moi les candidats qui maîtrisent React et PostgreSQL',
    'Quels sont les meilleurs profils pour le poste de développeur ?',
    'Quels candidats ont au moins 3 ans d\'expérience ?',
    'Génère une synthèse de présélection',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await ApiClient.askAiAssistant(textToSend, historyPayload);

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.answer || 'Je n\'ai pas pu traiter votre demande.',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: `Erreur : ${err.message || 'Impossible de contacter l\'agent IA.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-gray-200 dark:border-navy-800 flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-950 text-white flex items-center justify-between border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Assistant IA Recrutement RH</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PostgreSQL Live
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">Recherche sémantique & analyse de profils en langage naturel</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-gray-100 dark:bg-navy-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-navy-700'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-center text-xs text-gray-400">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-navy-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>L'assistant IA consulte la base de données PostgreSQL...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-navy-800 bg-gray-50/70 dark:bg-navy-950/40">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          Suggestions rapides :
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <div className="p-3 bg-white dark:bg-navy-900 border-t border-gray-200 dark:border-navy-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question sur les candidats ou les critères..."
            disabled={isLoading}
            className="flex-1 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
