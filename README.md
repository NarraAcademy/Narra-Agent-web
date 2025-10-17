

## Customize

- Set your environment variables

```bash
cp .env.example .env.development
```

- Set your theme in `src/app/theme.css`

[tweakcn](https://tweakcn.com/editor/theme)

- Set your landing page content in `src/i18n/pages/landing`

- Set your i18n messages in `src/i18n/messages`

1. Customize your environment variables

```bash
cp .env.example .env.production
cp wrangler.toml.example wrangler.toml
```

edit your environment variables in `.env.production`

and put all the environment variables under `[vars]` in `wrangler.toml`

2. Deploy

```bash
npm run cf:deploy
```# Narra-Agent-web
