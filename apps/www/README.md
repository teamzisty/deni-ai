# `apps/www`

A [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Project Structure

```
├── app             # Next.js App Router pages and route definitions
│   ├── [locale]    # Routes for each language (internationalization)
│   └── api         # API endpoints
├── components      # Reusable React components
├── hooks           # Custom React Hooks
├── lib             # Utility functions and helpers
├── i18n            # Internationalization configuration
├── messages        # Translation files (en.json, ja.json)
├── public          # Static assets (images, etc.)
└── utils           # Utility functions
```

## Configuration

### Resumable Streams (Optional)

The application supports resumable streams for improved chat experience during network interruptions. This feature requires Redis and is automatically enabled when `REDIS_URL` is configured.

**To enable resumable streams:**

1. Set up a Redis instance (local or cloud-based)
2. Add `REDIS_URL` to your environment variables:
   ```bash
   REDIS_URL=redis://localhost:6379
   # For Redis Cloud: REDIS_URL=rediss://username:password@host:port
   ```

**When resumable streams are disabled:**

- The application automatically falls back to regular streaming
- All chat functionality remains available
- No additional setup required
