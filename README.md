# frn-goat bot v2 🐐

A deploy-ready Telegram bot combining **Rose-style moderation** with **SimSimi-like chat replies**.

## Features
- Full moderation commands: warn, mute, kick, ban, promote, demote, notes, filters (basic).
- SimSimi-style chat replies for casual conversation (built-in, no external API required).
- Persistence via `lowdb` (JSON file) for warnings and settings.
- Dockerfile + GitHub Actions workflow to build and publish a Docker image to GitHub Container Registry (GHCR).
- Easy deploy: `npm install`, set `.env`, `npm start` or use the prebuilt Docker image.

# modification 
**if you want to add your information and other stuff just re edit `config.json`**
```bash
{
  "bot_name": "your bot name",
  "owner": {
    "name": "add your",
    "username": "own",
    "email": "example.gmail.com"
  },
  "settings": {
    "timezone": "Asia/Dhaka",
    "default_chat_enabled": true,
    "warn_limit": 3
  }
}
```


## Quick start (local)
```bash
npm install
cp .env.example .env
# edit .env and add TELEGRAM_BOT_TOKEN
npm start
```

## GitHub Actions (provided)
The workflow at `.github/workflows/ci-deploy.yml` will:
1. Build a Docker image on push to `main`.
2. Log in to GHCR and push image to `ghcr.io/<owner>/frn-goat-bot-v2:latest`.

To allow GHCR publishing you can rely on the automatically provided `GITHUB_TOKEN` (default scope) or set a PAT in repository secrets if needed.

## Files
- `src/` — modular source code
- `Dockerfile` — image builder
- `.github/workflows/ci-deploy.yml` — GH Actions workflow

## Notes
- Set `BOT_ADMINS` to your Telegram numeric user id(s).
- The bot stores data in `data/db.json` (created automatically).
