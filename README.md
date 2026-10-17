# AeroPulse AI — AI-Powered Air Quality Monitoring, Pollution Hotspots & Clean-Air Route Prediction System

AeroPulse AI is a full-stack environmental intelligence platform engineered with React 19, TypeScript, Tailwind CSS, Leaflet, and an Express proxy backend. It integrates live ground-station telemetry from WAQI (World Air Quality Index), CPCB, and TNPCB, combined with European CAMS satellite atmospheric models to deliver real-time air quality monitoring, pollution hotspot identification, clean-air navigation comparisons, and predictive health risk advisories.

---

## 🌟 Key Features

1. **Interactive 3D Globe & High-Resolution Street Map:**
   - Seamless 3D planetary Earth model with step and continuous rotation controls (`←`, `→`, tilt `▲`/`▼`, spacebar pause).
   - Continuous zoom from planetary orbit into street-level roads and monitoring stations.
   - Street view with ESRI World Street, OpenStreetMap, and Satellite imagery layers.

2. **Pollution Hotspots Intelligence:**
   - Real-time identification of severe pollution clusters across Tamil Nadu (Chennai, Coimbatore, Madurai, Salem, etc.) and all of India.
   - Live summary metrics: reporting station counts, peak hotspot AQI, unhealthy stations count, and cleanest sanctuaries.
   - District-level severity rankings with arithmetic mean aggregation and contributing station counts.
   - Top hotspots leaderboard with criteria pollutant concentrations (`PM2.5`, `PM10`, `NO₂`, `SO₂`, `O₃`, `CO`).

3. **Clean-Air Route Finder:**
   - Commuter route comparison powered by the Open Source Routing Machine (OSRM) engine.
   - Compares arterial highway corridors against outer green belt bypass corridors.
   - Samples nearby CAAQMS stations along each route polyline to compute exposure AQI scores and inhaled particulate reductions (e.g. 28% to 45% lower PM2.5 exposure).
   - Pre-configured commuter presets for Chennai, Coimbatore, Madurai, and Delhi.

4. **Health Persona Advisory:**
   - Personalized clinical and activity advisories for asthmatics, children, outdoor athletes, elderly individuals, and general commuters.
   - Real-time calculation of safe outdoor activity windows and protective precautions.

5. **"What-If" Scenario Simulator:**
   - Interactive policy and environmental sliders (industrial shutdowns, EV adoption, stubble burning, rain washout, wind dispersion).
   - Simulates particulate reductions in real time.

6. **ML Trends & Predictive Analytics:**
   - 24-hour predictive forecast modeling diurnal atmospheric boundary layer dynamics, peak rush-hour traffic emissions, and overnight cooling inversions.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/aeropulse-ai.git
   cd aeropulse-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Add your Gemini API key or WAQI token inside `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   WAQI_API_TOKEN="your_waqi_token"
   ```
   *(Note: The application includes calibrated live fallback streams and default proxy tokens, so it functions immediately out of the box even without custom keys).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📦 Project Structure

```
├── public/                 # Static assets & icons
├── server/                 # Backend proxy & station data
│   ├── chatEngine.ts       # AI chat & tool declarations
│   └── indiaStationsData.ts # Real-time CAAQMS station feeds
├── src/
│   ├── components/         # React UI Components
│   │   ├── Header.tsx      # Top bar navigation & tabs
│   │   ├── Unified3DGlobeMap.tsx # 3D Globe & Street Map with rotation
│   │   ├── PollutionHotspotsDashboard.tsx # Hotspots & Clean-Air Route Finder
│   │   ├── PersonaSelector.tsx # Health risk personas
│   │   ├── WhatIfSimulator.tsx # Environmental scenario simulator
│   │   ├── ForecastSection.tsx # ML forecasting & trends
│   │   └── ...
│   ├── data/               # Indian locations, districts & global cities
│   ├── utils/              # AQI calculations, EPA breakpoints & ML engine
│   ├── types.ts            # TypeScript interfaces & types
│   ├── App.tsx             # Root dashboard coordinator
│   └── main.tsx            # React application entry
├── server.ts               # Express full-stack entry & OSRM route evaluation
├── vite.config.ts          # Vite build & bundle configuration
└── package.json
```

---

## 🌐 Deploying to GitHub & Sharing with Anyone

Follow these steps to push your codebase to GitHub and host it live online:

### Step 1: Initialize Git and Commit
```bash
# Initialize local git repository
git init

# Stage all project files
git add .

# Create initial commit
git commit -m "feat: AeroPulse AI with 3D Globe, Pollution Hotspots & Clean-Air Route Finder"
```

### Step 2: Push to GitHub
1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g. `aeropulse-ai`). Keep it **Public**.
2. Run the following commands in your terminal:
   ```bash
   # Rename branch to main
   git branch -M main

   # Link remote repository (replace with your GitHub URL)
   git remote add origin https://github.com/YOUR_USERNAME/aeropulse-ai.git

   # Push code
   git push -u origin main
   ```

### Step 3: Make it Live for Anyone with a Link

Because AeroPulse AI has both a React frontend and an Express backend (`server.ts`), the easiest 100% free hosting platforms are:

#### Option A: Render.com (Recommended — 2-minute setup)
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** ➔ **Web Service**.
3. Select your `aeropulse-ai` repository.
4. Set the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Click **Create Web Service**.
6. Render will build and deploy your app, providing a live public URL (e.g. `https://aeropulse-ai.onrender.com`) that anyone can open!

#### Option B: Railway.app
1. Go to [railway.app](https://railway.app) and click **New Project** ➔ **Deploy from GitHub repo**.
2. Select `aeropulse-ai`.
3. Railway automatically detects `package.json` (`npm run build` & `npm start`) and generates a public domain.

#### Option C: Vercel or Netlify
For serverless deployments, you can deploy the frontend build or use Vercel's Node.js Serverless Functions for `/api/*` routes.

---

## 📜 License
MIT License. Open-source for academic research and environmental monitoring initiatives.
