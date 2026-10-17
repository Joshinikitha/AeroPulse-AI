import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession, ToolExecutionInfo, ProactiveAdvisory } from '../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputBar } from './ChatInputBar';
import { ChatSidebar } from './ChatSidebar';
import { ChatSetupModal } from './ChatSetupModal';
import {
  PanelLeft,
  Sparkles,
  Zap,
  Activity,
  Download,
  Trash2,
  Moon,
  Sun,
  Code2,
  ArrowLeft,
} from 'lucide-react';

interface ChatContainerProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onSwitchToDashboard?: () => void;
}

const STORAGE_KEY = 'aeropulse_chat_sessions_v2';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome-01',
  role: 'assistant',
  content: `Hello! I am **AeroPulse Conversational AI**, your real-time environmental intelligence assistant and meteorological safety advisor.

I am integrated directly with live planetary sensor networks, CAMS air quality monitoring, and real-time public health advisories:

- 🌤️ **Live Atmospheric & Weather Telemetry:** Ask me for current conditions or AQI breakdown in any city worldwide.
- 🏃 **Proactive Outdoor Safety Assessments:** Tell me your workout, run, or travel plans, and I'll calculate real-time physiological risk scores.
- 📰 **Live Environmental News:** Inquire about breaking sustainability and clean air updates.
- 🔮 **Machine Learning Predictions:** Discover forecasted pollution peaks over the next 24 to 48 hours.

What location or activity would you like to explore right now?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestions: [
    '🌤️ What is the live air quality in Tokyo?',
    '🏃 Is it safe to go for a run in London right now?',
    '📰 Show latest environmental news headlines',
    '🫁 What precautions should asthma patients take?',
  ],
};

export const ChatContainer: React.FC<ChatContainerProps> = ({
  isDark,
  onToggleTheme,
  onSwitchToDashboard,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load chat sessions from localStorage:', e);
    }
    const initialSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Real-Time Air Quality & Safety',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [INITIAL_WELCOME_MESSAGE],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(
    sessions[0]?.id || 'session-default'
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to persist sessions:', e);
    }
  }, [sessions]);

  // Current Active Session
  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isStreaming]);

  // Play subtle synthesis chimes using Web Audio API
  const playChime = (type: 'send' | 'receive') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
    } catch (e) {
      // AudioContext not allowed before user gesture
    }
  };

  // Session Handlers
  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [INITIAL_WELCOME_MESSAGE],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: `session-${Date.now()}`,
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [INITIAL_WELCOME_MESSAGE],
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleClearAllSessions = () => {
    if (confirm('Clear all conversation history?')) {
      const fresh: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [INITIAL_WELCOME_MESSAGE],
      };
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    }
  };

  const handleExportSession = () => {
    if (!currentSession) return;
    let md = `# AeroPulse AI Conversation: ${currentSession.title}\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;
    for (const m of currentSession.messages) {
      md += `### ${m.role === 'user' ? 'User' : 'AeroPulse Assistant'} (${m.timestamp})\n\n${m.content}\n\n`;
      if (m.toolsUsed && m.toolsUsed.length > 0) {
        md += `*Tools Used:* ${m.toolsUsed.map((t) => t.toolName).join(', ')}\n\n`;
      }
      if (m.proactiveAdvisory) {
        md += `> **Proactive Alert:** ${m.proactiveAdvisory.title} - ${m.proactiveAdvisory.message}\n\n`;
      }
      md += `---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeropulse-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send Message & Connect to Streaming Endpoint
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    playChime('send');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const botMessageId = `msg-${Date.now()}-bot`;
    const botInitialMessage: ChatMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      toolsUsed: [],
    };

    // Update active session with user message and placeholder bot message
    const updatedMessages = [...currentSession.messages, userMessage, botInitialMessage];

    // Automatically update session title if it's the first user turn
    const isFirstUserTurn = currentSession.messages.filter((m) => m.role === 'user').length === 0;
    const newTitle = isFirstUserTurn
      ? content.slice(0, 36) + (content.length > 36 ? '...' : '')
      : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: newTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : s
      )
    );

    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: Failed to connect to chat stream`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let accumulatedContent = '';
      let tools: ToolExecutionInfo[] = [];
      let proactive: ProactiveAdvisory | undefined = undefined;
      let suggestions: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.replace('data:', '').trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (currentEvent === 'tool_start') {
                const newTool: ToolExecutionInfo = {
                  toolName: parsed.toolName,
                  label: parsed.label,
                  status: 'running',
                  input: parsed.args,
                  outputSummary: `Executing ${parsed.toolName}...`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                tools = [...tools.filter((t) => t.toolName !== parsed.toolName), newTool];
              } else if (currentEvent === 'tool_result') {
                tools = [
                  ...tools.filter((t) => t.toolName !== parsed.toolName),
                  parsed as ToolExecutionInfo,
                ];
              } else if (currentEvent === 'proactive') {
                proactive = parsed as ProactiveAdvisory;
              } else if (currentEvent === 'chunk') {
                accumulatedContent += parsed.text;
              } else if (currentEvent === 'suggestions') {
                suggestions = parsed.suggestions || [];
              } else if (currentEvent === 'done') {
                playChime('receive');
              }

              // Update active bot message in state
              setSessions((prevSessions) =>
                prevSessions.map((s) =>
                  s.id === currentSession.id
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === botMessageId
                            ? {
                                ...m,
                                content: accumulatedContent,
                                toolsUsed: tools,
                                proactiveAdvisory: proactive,
                                suggestions,
                                isStreaming: currentEvent !== 'done',
                              }
                            : m
                        ),
                      }
                    : s
                )
              );
            } catch (err) {
              console.warn('SSE parse error:', err, dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User cancelled stream');
      } else {
        console.error('Streaming connection error:', err);
        setSessions((prevSessions) =>
          prevSessions.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === botMessageId
                      ? {
                          ...m,
                          content:
                            m.content +
                            `\n\n*(Notice: Network interruption occurred. Real-time atmospheric sensors remain active. Please retry.)*`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      // Mark bot message streaming as finished
      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === botMessageId ? { ...m, isStreaming: false } : m
                ),
              }
            : s
        )
      );
    }
  };

  return (
    <div
      className={`relative flex h-screen w-full overflow-hidden transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Sidebar / Conversation Sessions Drawer */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setSidebarOpen(false);
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        onExportSession={handleExportSession}
        onOpenSetupModal={() => setSetupModalOpen(true)}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header
          className={`h-14 shrink-0 px-4 border-b flex items-center justify-between transition-colors z-10 ${
            isDark
              ? 'bg-slate-950/80 border-slate-800/80 backdrop-blur-md'
              : 'bg-white/80 border-slate-200 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {currentSession?.title}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Tool Grounded
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch to Full Sensor Dashboard Button */}
            {onSwitchToDashboard && (
              <button
                onClick={onSwitchToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors cursor-pointer"
                title="Return to Sensor Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <Activity className="w-3.5 h-3.5 text-sky-200" />
                <span>Sensor Dashboard</span>
              </button>
            )}

            {/* Open Code Deliverables Setup Modal */}
            <button
              onClick={() => setSetupModalOpen(true)}
              title="View Setup & Python Code Deliverables"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Code2 className="w-4 h-4 text-sky-500" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              title="Toggle theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>
          </div>
        </header>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 overflow-y-auto py-2">
          {currentSession?.messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              onSelectSuggestion={(sug) => handleSendMessage(sug)}
              isDark={isDark}
            />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Chat Input Bar */}
        <footer className="shrink-0">
          <ChatInputBar
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            isStreaming={isStreaming}
            isDark={isDark}
          />
        </footer>
      </main>

      {/* Setup & Python Code Deliverables Modal */}
      <ChatSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
};
