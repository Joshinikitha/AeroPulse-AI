import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  MapPin,
  Sparkles,
  RefreshCw,
  Compass,
  Wind,
  Activity,
  Newspaper,
} from 'lucide-react';

interface ChatInputBarProps {
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  isStreaming: boolean;
  isDark?: boolean;
}

const QUICK_STARTERS = [
  {
    icon: <Wind className="w-3.5 h-3.5 text-sky-500" />,
    label: 'Tokyo AQI & Weather',
    prompt: "What is the live weather and air quality in Tokyo right now?",
  },
  {
    icon: <Activity className="w-3.5 h-3.5 text-emerald-500" />,
    label: 'Morning Run in London',
    prompt: "Is it safe to go for a 5km morning run in London today?",
  },
  {
    icon: <Newspaper className="w-3.5 h-3.5 text-indigo-500" />,
    label: 'Latest Clean Air News',
    prompt: "What are the latest real-time news headlines on environment and clean air?",
  },
  {
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
    label: 'New Delhi Pollution Analysis',
    prompt: "Check real-time air pollutants for New Delhi and evaluate health risks for children.",
  },
];

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  isDark = false,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1&language=en&format=json`
          );
          let prompt = `Check current weather, air quality, and outdoor safety for my coordinates: ${lat.toFixed(3)}, ${lon.toFixed(3)}.`;
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results[0]?.name) {
              prompt = `What is the live weather and air quality in ${data.results[0].name}? Is it safe for outdoor exercise today?`;
            }
          }
          setInput(prompt);
          textareaRef.current?.focus();
        } catch (err) {
          setInput(`What is the live air quality at coordinates ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}?`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or error:', err);
        setIsDetectingLocation(false);
        setInput("What is the real-time weather and air quality in New York?");
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 pt-1 space-y-2">
      {/* Persistent Suggestion Tray */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          <Compass className="w-3 h-3" />
          Quick Tray:
        </span>
        {QUICK_STARTERS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(item.prompt)}
            disabled={isStreaming}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div
        className={`relative rounded-2xl border transition-all shadow-sm ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20'
            : 'bg-white border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening to your voice... Speak now.'
              : 'Ask anything (e.g., "Check live AQI in Paris", "Is it safe to run in London?", "Latest eco news")...'
          }
          rows={1}
          className={`w-full resize-none bg-transparent pt-3.5 pb-12 px-4 text-sm focus:outline-hidden transition-all ${
            isDark
              ? 'text-slate-100 placeholder:text-slate-500'
              : 'text-slate-900 placeholder:text-slate-400'
          }`}
        />

        {/* Action Controls Toolbar inside input */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-auto">
          {/* Left quick tools */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation || isStreaming}
              title="Detect my location & assess conditions"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <MapPin
                className={`w-3.5 h-3.5 ${
                  isDetectingLocation ? 'animate-spin text-sky-500' : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline text-[11px] font-medium">
                {isDetectingLocation ? 'Locating...' : 'My Location'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isStreaming}
              title={isListening ? 'Stop listening' : 'Speak using microphone'}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                isListening
                  ? 'text-rose-500 bg-rose-500/10 animate-pulse'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline text-[11px] font-medium">
                {isListening ? 'Listening' : 'Voice'}
              </span>
            </button>
          </div>

          {/* Right send / stop controls */}
          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline text-[10px] font-mono ${
                isDark ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Enter to send, Shift+Enter for newline
            </span>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all shadow-xs cursor-pointer ${
                  input.trim()
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20'
                    : isDark
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
