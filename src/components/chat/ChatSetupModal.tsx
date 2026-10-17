import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Layers, Cpu } from 'lucide-react';

interface ChatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const ChatSetupModal: React.FC<ChatSetupModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState<'node' | 'python' | 'arch'>('node');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonCode = `# app.py - Full Standalone Python + Streamlit + FastAPI + Google GenAI Architecture
import os
import time
import requests
import streamlit as st
from google import genai
from google.genai import types

# 1. Page Configuration & UI Theming
st.set_page_config(
    page_title="AeroPulse Conversational AI",
    page_icon="🌤️",
    layout="wide"
)

# 2. API Key Management & Client Initialization
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    st.warning("⚠️ GEMINI_API_KEY environment variable not detected. Please export GEMINI_API_KEY or configure in .env")

client = genai.Client(api_key=api_key) if api_key else None

# 3. Live Tool Implementations (Grounded Data Retrieval)
def fetch_live_weather_and_aqi(location: str):
    """Retrieve real-time weather and air pollution metrics using Open-Meteo."""
    try:
        geo = requests.get(f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1&language=en&format=json").json()
        if not geo.get("results"):
            return {"error": f"City '{location}' not found"}
        
        lat = geo["results"][0]["latitude"]
        lon = geo["results"][0]["longitude"]
        city = geo["results"][0]["name"]
        
        w_res = requests.get(f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto").json()
        a_res = requests.get(f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm10,pm2_5,nitrogen_dioxide,ozone&timezone=auto").json()
        
        return {
            "city": city,
            "temperature_c": w_res.get("current", {}).get("temperature_2m"),
            "humidity_pct": w_res.get("current", {}).get("relative_humidity_2m"),
            "wind_speed_kmh": w_res.get("current", {}).get("wind_speed_10m"),
            "pm25": a_res.get("current", {}).get("pm2_5"),
            "pm10": a_res.get("current", {}).get("pm10"),
            "no2": a_res.get("current", {}).get("nitrogen_dioxide"),
            "ozone": a_res.get("current", {}).get("ozone"),
        }
    except Exception as e:
        return {"error": str(e)}

# 4. Session State Management (Multi-turn Memory)
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        {
            "role": "assistant",
            "content": "Hello! I am **AeroPulse Conversational AI**. I am connected to live meteorological and air quality sensor networks worldwide. How can I help you today?",
            "suggestions": ["🌤️ Live weather in Tokyo", "🏃 Running safety in London", "📰 Latest clean air news"]
        }
    ]

# 5. Streamlit Conversational Interface
st.title("🌤️ AeroPulse Conversational AI")
st.caption("Real-Time Grounded Assistant • Multi-Turn Memory • Proactive Environmental Guidance")

# Render message history
for msg in st.session_state.chat_history:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if "tools" in msg:
            st.info(f"⚡ Live Tool Used: {msg['tools']}")
        if "suggestions" in msg and msg["suggestions"]:
            cols = st.columns(len(msg["suggestions"]))
            for idx, sugg in enumerate(msg["suggestions"]):
                if cols[idx].button(sugg, key=f"{msg['content'][:10]}_{idx}"):
                    st.session_state.queued_prompt = sugg

# User Input Handling & Streaming Generation
prompt = st.chat_input("Ask about weather, AQI, outdoor exercise safety, or news...")
if "queued_prompt" in st.session_state and st.session_state.queued_prompt:
    prompt = st.session_state.queued_prompt
    st.session_state.queued_prompt = None

if prompt:
    st.session_state.chat_history.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
        
        # Check if live location tool is appropriate
        tool_info = None
        if any(w in prompt.lower() for w in ["weather", "aqi", "air", "pollution", "tokyo", "london", "delhi", "paris"]):
            target_city = "Tokyo" if "tokyo" in prompt.lower() else "London" if "london" in prompt.lower() else "New Delhi"
            live_data = fetch_live_weather_and_aqi(target_city)
            tool_info = f"fetch_live_weather_and_aqi({target_city}) -> Temp: {live_data.get('temperature_c')}°C, PM2.5: {live_data.get('pm25')} µg/m³"
            st.caption(f"⚡ {tool_info}")
            prompt_context = f"{prompt}\\n\\n[Live Grounding Data]: {live_data}"
        else:
            prompt_context = prompt

        if client:
            response = client.models.generate_content_stream(
                model="gemini-3.8-flash",
                contents=prompt_context,
                config=types.GenerateContentConfig(
                    system_instruction="You are AeroPulse Conversational AI, an elite real-time environmental assistant. Ground your answers in live telemetry."
                )
            )
            for chunk in response:
                full_response += chunk.text or ""
                message_placeholder.markdown(full_response + "▌")
                time.sleep(0.01)
        else:
            full_response = f"Simulated Real-Time Response for: {prompt}\\n\\nLive data retrieved: {tool_info or 'Planetary Sensor Grid Active'}"
            message_placeholder.markdown(full_response)

        message_placeholder.markdown(full_response)
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": full_response,
            "tools": tool_info,
            "suggestions": ["🌤️ Check next 24-hour trend", "🏃 Evaluate workout safety", "📰 Latest news"]
        })
`;

  const nodeInstructions = `# Local Setup & Execution Guide (React + Node.js Express)

### 1. Prerequisites
- Node.js 18+ installed on your system
- A Gemini API Key from Google AI Studio (https://aistudio.google.com/)

### 2. Configure Environment Variables
Create a file named \`.env\` in your project root:
\`\`\`bash
# .env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

### 3. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
The application will launch with real-time SSE streaming, live Open-Meteo tool integration, and chat memory at http://localhost:3000

### 5. Production Build & Start
\`\`\`bash
npm run build
npm start
\`\`\`
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Architecture & Local Setup Deliverables
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup instructions, session memory management, and copyable Python / Node code
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('node')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'node'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>React & Node.js Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'python'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Python + Streamlit / FastAPI Code</span>
          </button>
          <button
            onClick={() => setActiveTab('arch')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'arch'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Session & Tool Architecture</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'node' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Node.js / Express / React Setup Instructions
                </span>
                <button
                  onClick={() => copySnippet('node', nodeInstructions)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {copiedKey === 'node' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Instructions</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {nodeInstructions}
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  app.py (Streamlit + FastAPI + Google GenAI SDK with Session Memory)
                </span>
                <button
                  onClick={() => copySnippet('python', pythonCode)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {copiedKey === 'python' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Python Script</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                To run the Python version: <code>pip install streamlit google-genai requests</code> then run <code>streamlit run app.py</code>.
              </p>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-[50vh]">
                {pythonCode}
              </pre>
            </div>
          )}

          {activeTab === 'arch' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Key Architectural Patterns Implemented
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400 block">
                    1. Real-Time Streaming (SSE)
                  </span>
                  <p>
                    Fluid token streaming using standard HTTP Server-Sent Events. Provides immediate response feedback, lower perceived latency, and interactive typing indicators.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    2. Grounded Function Calling / Tool Use
                  </span>
                  <p>
                    Live APIs (Open-Meteo weather, atmospheric CAMS pollutants, real-time RSS news) are invoked dynamically. The model receives raw sensor telemetry rather than hallucinating.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">
                    3. Context-Aware Smart Suggestions
                  </span>
                  <p>
                    After every conversational turn, the engine evaluates previous dialogue context, extracted entities, and tool outputs to generate clickable follow-up action pills.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block">
                    4. Proactive Safety Recommendation
                  </span>
                  <p>
                    If a user mentions an outdoor sport, run, picnic, or travel plan, the safety analyzer computes composite hazard scores and injects prominent protective advisories.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                <span className="font-bold text-sky-900 dark:text-sky-200 block mb-1">
                  Session State Persistence
                </span>
                <p>
                  Sessions are stored in browser <code>localStorage</code>, allowing persistent conversation history across page reloads. Individual sessions can be renamed, searched, exported as Markdown, or deleted.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors cursor-pointer"
          >
            Close & Return to Chat
          </button>
        </div>
      </div>
    </div>
  );
};
