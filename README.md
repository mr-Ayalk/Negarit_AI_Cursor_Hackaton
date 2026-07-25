# Negarit AI

Product-ready AI visiting guide for **Adwa Museum**.

One Next.js app. **WiFi zone** hall detection, **RAG** over `adwa_museum_ai_knowledge_expanded`, live voice loop (**ElevenLabs** STT + TTS), **Addis AI** for Amharic conversation, Telebirr shop/tips, animated hall routing, visit story.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

Copy `.env.example` → `.env.local` and set:

- `ADDIS_AI_API_KEY` — guide replies & translation
- `ELEVENLABS_API_KEY` — natural voice TTS
- `ELEVENLABS_VOICE_ID` — optional (defaults to a multilingual voice)

## Visit flow

1. **Setup** — name, museum WiFi, microphone  
2. **Guide** — connects WiFi zones, welcomes you at Gateway  
3. **Walk halls** — 5gna Ber → 6gna Ber → Emperor Hall → Victory Court  
4. **Ask** — speak (voice → text → voice), Addis AI for Amharic  
5. **Shop / Tip** — Telebirr  
6. **Story** — generate & share your day chronicle  

## Deploy (Vercel)

Import repo → add `ADDIS_AI_API_KEY` and `ELEVENLABS_API_KEY` in Environment Variables → Deploy.

> Live WiFi SSID detection works when the app runs on the visitor device (`localhost` / local network). Remote Vercel deploys cannot read the phone’s SSID; use hall buttons or SSID join there.
