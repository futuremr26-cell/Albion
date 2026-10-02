import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Play,
  Lightbulb,
  Trash2,
  Database,
  BarChart2,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { ChatMessage, DataProfile, KPIItem } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businessProblem: string;
  objectives: string;
  dataProfile: DataProfile | null;
  kpis: KPIItem[];
  recentQuery: { sql: string; status: string; rowCount: number } | null;
  onRunSqlInStudio?: (sql: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  businessProblem,
  objectives,
  dataProfile,
  kpis,
  recentQuery,
  onRunSqlInStudio,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **InsightBot AI Analyst**. 

I am equipped with your business problem, project objectives, and the dataset schema for table \`data\`. 

Ask me any questions such as:
- **"What factors are driving anomalies in our data?"**
- **"Suggest a SQL query to measure segment contribution margin."**
- **"What executive actions should we prioritize based on the identified KPIs?"**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          context: {
            businessProblem,
            objectives,
            schema: dataProfile?.columns,
            sampleRows: dataProfile?.previewRows.slice(0, 5),
            kpis,
            recentQuery,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get chat response');

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.response || 'I have analyzed the request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `⚠️ Error: ${err?.message || 'Could not communicate with AI assistant.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation history cleared. Ready for your next data inquiry!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to extract and format SQL blocks within markdown
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim().toLowerCase();
        const isSql = lang === 'sql' || part.toLowerCase().includes('select');
        const code = (lang === 'sql' ? lines.slice(1) : lines).join('\n');
        const blockId = `${msgId}-${index}`;

        return (
          <div
            key={index}
            className="my-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xs"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-mono flex items-center gap-1.5 font-semibold text-indigo-400">
                <Terminal className="w-3 h-3" />
                {lang || 'sql'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyCode(code, blockId)}
                  className="hover:text-white p-1 rounded transition-colors inline-flex items-center gap-1"
                  title="Copy code"
                >
                  {copiedId === blockId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedId === blockId ? 'Copied' : 'Copy'}</span>
                </button>
                {isSql && onRunSqlInStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onRunSqlInStudio(code);
                      onClose();
                    }}
                    className="hover:text-emerald-400 p-1 rounded transition-colors inline-flex items-center gap-1 font-semibold text-emerald-500"
                    title="Run in SQL Studio"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run in Studio</span>
                  </button>
                )}
              </div>
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {code}
            </pre>
          </div>
        );
      }

      // Simple formatting for bold, bullets and newlines
      const lines = part.split('\n');
      return (
        <span key={index}>
          {lines.map((line, lIdx) => {
            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
            const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            return (
              <span key={lIdx} className="block leading-relaxed">
                {isBullet ? (
                  <span
                    className="inline-block pl-2 text-slate-700 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                  />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                )}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const samplePrompts = [
    'What are our top 3 risk factors in this dataset?',
    'Suggest a query for customer return rate by category',
    'Explain the identified KPIs in executive terms',
    'Recommend next strategic actions for operations',
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Side Drawer Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Data Assistant
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Grounding answers in your business context &amp; table schema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Context Strip */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-[10px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium">
            <Database className="w-3 h-3" />
            {dataProfile ? `${dataProfile.rowCount} rows • ${dataProfile.columns.length} cols` : 'No data'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
            <BarChart2 className="w-3 h-3" />
            {kpis.length} KPIs attached
          </span>
          {recentQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium truncate max-w-[170px]">
              Query: {recentQuery.rowCount} rows
            </span>
          )}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div>{renderMessageContent(msg.content, msg.id)}</div>
                <div
                  className={`mt-1.5 text-[9px] text-right font-mono ${
                    msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Formulating insight...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-1.5">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            Quick Inquiry Prompts:
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
              placeholder="Ask about data trends, query ideas, or metrics..."
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
