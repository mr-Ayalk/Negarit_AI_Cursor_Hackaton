# Negarit AI

Product-ready AI visiting guide for **Adwa Museum**.

One Next.js app. **WiFi zone** hall detection, **RAG** over Adwa museum knowledge, live voice (**ElevenLabs** STT + TTS), **Addis AI** for Amharic, **Chapa** for shop & tips, animated hall routing, visit story.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

Copy `.env.example` → `.env.local` and set:

- `ADDIS_AI_API_KEY` — guide replies & translation
- `ELEVENLABS_API_KEY` — voice STT + TTS
- `ELEVENLABS_VOICE_ID` — optional multilingual voice
- `CHAPA_SECRET_KEY` — Chapa payments (server)
- `NEXT_PUBLIC_CHAPA_PUBLIC_KEY` — Chapa public key
- `CHAPA_ENCRYPTION_KEY` — Chapa encryption (mobile/inline)
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` (return/callback URLs)

## Visit flow

1. **Setup** — name, museum WiFi, microphone  
2. **Guide** — connects WiFi zones, welcomes you at Gateway  
3. **Walk halls** — 5gna Ber → 6gna Ber → Emperor Hall → Victory Court  
4. **Ask** — speak (voice → text → voice), Addis AI for Amharic  
5. **Shop / Tip** — Chapa checkout  
6. **Story** — generate & share your day chronicle  

## Deploy (Vercel)

Import repo → add `ADDIS_AI_API_KEY`, `ELEVENLABS_API_KEY`, `CHAPA_SECRET_KEY`, `NEXT_PUBLIC_CHAPA_PUBLIC_KEY`, and `NEXT_PUBLIC_APP_URL` → Deploy.

> Live WiFi SSID detection works when the app runs on the visitor device (`localhost` / local network). Remote Vercel deploys cannot read the phone’s SSID; use hall buttons or SSID join there.
