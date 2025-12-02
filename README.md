<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1WFhimFLaeqP8rjmbN09poNaOo8wSHCKZ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Install Vercel CLI (optional for local previews): `npm i -g vercel`
2. Add environment variables in Vercel Project Settings → **Environment Variables**:
   - `GEMINI_API_KEY`
3. Deploy:
   - With CLI: `vercel --prod` (auto-runs `npm run build` and serves `dist/`).
   - From dashboard: import this repo; Framework Preset **Vite**; Build Command `npm run build`; Output Directory `dist`.
4. SPA routing is configured in `vercel.json` to rewrite all paths to `index.html`.
