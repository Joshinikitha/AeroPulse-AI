import React, { useState } from 'react';
import { ChatMessage, ToolExecutionInfo, ProactiveAdvisory } from '../../types';
import Markdown from 'react-markdown';
import {
  User,
  Sparkles,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  onSelectSuggestion?: (suggestion: string) => void;
  onRetry?: (content: string) => void;
  isDark?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSelectSuggestion,
  onRetry,
  isDark = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(
    message.liked === true ? 'liked' : message.liked === false ? 'disliked' : null
  );
  const [showRawTools, setShowRawTools] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      // Clean markdown tags for natural speech
      const cleanText = message.content
        .replace(/[#*`_~[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const getAdvisoryTheme = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return {
          container: isDark
            ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
            : 'bg-rose-50 border-rose-300 text-rose-900',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />,
          badge: 'bg-rose-600 text-white',
        };
      case 'warning':
        return {
          container: isDark
            ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
            : 'bg-amber-50 border-amber-300 text-amber-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          badge: 'bg-amber-600 text-white',
        };
      default:
        return {
          container: isDark
            ? 'bg-sky-950/40 border-sky-800/80 text-sky-200'
            : 'bg-sky-50 border-sky-300 text-sky-900',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
          badge: 'bg-sky-600 text-white',
        };
    }
  };

  return (
    <div
      className={`group w-full py-4 px-3 sm:px-6 transition-colors ${
        isUser
          ? isDark
            ? 'bg-slate-900/30'
            : 'bg-transparent'
          : isDark
          ? 'bg-slate-900/80 border-y border-slate-800/80'
          : 'bg-slate-50/80 border-y border-slate-200/60'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs ring-2 ring-sky-400/20">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body & Addons */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold tracking-tight ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {isUser ? 'You' : 'AeroPulse Conversational Assistant'}
              </span>
              <span
                className={`text-[10px] font-mono ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {message.timestamp}
              </span>
              {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Zap className="w-2.5 h-2.5" />
                  Live Tool Grounded ({message.toolsUsed.length})
                </span>
              )}
            </div>

            {/* Quick Actions for Bot Message */}
            {!isUser && !message.isStreaming && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  title="Copy message to clipboard"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={handleToggleSpeech}
                  title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isSpeaking
                      ? 'text-sky-500 bg-sky-500/10'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 animate-pulse text-sky-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
                  title="Helpful response"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    feedback === 'liked'
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
                  title="Needs improvement"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    feedback === 'disliked'
                      ? 'text-rose-500 bg-rose-500/10'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Tool Execution Badges */}
          {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
            <div className="space-y-2 pt-1">
              {message.toolsUsed.map((tool, idx) => (
                <div
                  key={`${tool.toolName}-${idx}`}
                  className={`rounded-xl border p-2.5 text-xs transition-all ${
                    isDark
                      ? 'bg-slate-800/80 border-slate-700/80 text-slate-300'
                      : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-sky-500/10 text-sky-500">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        Tool Used: <span className="font-mono text-sky-600 dark:text-sky-400">{tool.toolName}</span>
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Success
                      </span>
                    </div>

                    <button
                      onClick={() => setShowRawTools(!showRawTools)}
                      className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <span>{showRawTools ? 'Hide Payload' : 'View Payload'}</span>
                      {showRawTools ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                    {tool.outputSummary}
                  </p>

                  {/* Raw Data Accordion */}
                  {showRawTools && tool.rawData && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-[11px] overflow-x-auto max-h-40 p-2 rounded bg-slate-950 text-slate-300">
                      <pre>{JSON.stringify(tool.rawData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Proactive Advisory Banner (if generated by the system) */}
          {!isUser && message.proactiveAdvisory && (
            <div
              className={`rounded-xl border p-3.5 text-xs flex items-start gap-3 shadow-2xs ${
                getAdvisoryTheme(message.proactiveAdvisory.severity).container
              }`}
            >
              {getAdvisoryTheme(message.proactiveAdvisory.severity).icon}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight">
                    {message.proactiveAdvisory.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      getAdvisoryTheme(message.proactiveAdvisory.severity).badge
                    }`}
                  >
                    Proactive Alert
                  </span>
                </div>
                <p className="leading-relaxed opacity-90">
                  {message.proactiveAdvisory.message}
                </p>
                <div className="pt-1 font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                  <span className="text-slate-500 dark:text-slate-400">Action:</span>
                  <span>{message.proactiveAdvisory.recommendation}</span>
                </div>
              </div>
            </div>
          )}

          {/* Markdown Content */}
          <div
            className={`prose prose-sm max-w-none break-words text-sm leading-relaxed ${
              isDark
                ? 'prose-invert text-slate-200'
                : 'text-slate-800'
            }`}
          >
            <div className="markdown-body">
              <Markdown>{message.content}</Markdown>
            </div>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-sky-500 animate-pulse ml-1 align-middle" />
            )}
          </div>

          {/* Context-Aware Smart Suggestions Chips (Feature #2) */}
          {!isUser &&
            !message.isStreaming &&
            message.suggestions &&
            message.suggestions.length > 0 &&
            onSelectSuggestion && (
              <div className="pt-2 space-y-1.5">
                <span
                  className={`text-[11px] font-bold tracking-tight uppercase block ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  💡 Suggested Follow-Ups & Quick Actions:
                </span>
                <div className="flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => onSelectSuggestion(suggestion)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all group/chip cursor-pointer shadow-2xs ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-sky-500'
                          : 'bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <span>{suggestion}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover/chip:text-sky-500 group-hover/chip:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
