# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

## Deployment

### GitHub Actions CI

[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)

The CI pipeline runs on every push to `main` and all pull requests. It executes:
- ESLint linting
- Vitest unit tests
- Playwright E2E tests

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Set environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-api.vercel.app
   ```
   You can do this via the Vercel dashboard (Project → Settings → Environment Variables) or CLI:
   ```
   vercel env add VITE_API_BASE_URL
   ```
5. Deploy:
   - **Preview**: `vercel`
   - **Production**: `vercel --prod`

#### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Dev (MSW): No | Backend API origin (e.g., `http://127.0.0.1:6333`) |
| `VITE_APP_ENV` | No | `development`, `preview`, or `production` |
| `VITE_SENTRY_DSN` | No | Sentry error tracking |
| `VITE_PHOENIX_URL` | No | Phoenix tracing endpoint |

### Running Modes

#### MSW Mode (default in dev)
- `VITE_API_BASE_URL` is **not set** or empty
- All `/api/*` requests are intercepted by MSW (Mock Service Worker)
- No real backend required
- Start: `npm run dev`

#### Real Backend Mode (local development)
- `VITE_API_BASE_URL=http://127.0.0.1:6333` (or your backend port)
- All `/api/*` requests go to the real FastAPI backend
- Backend must be running at the specified origin
- Start: `VITE_API_BASE_URL=http://127.0.0.1:6333 npm run dev` (Windows: `set VITE_API_BASE_URL=http://127.0.0.1:6333 && npm run dev`)

#### Production / Preview
- `VITE_API_BASE_URL` must be set to the production backend origin
- No MSW interception
- Deploy to Vercel with the correct environment variable set

> **Note:** MSW (Mock Service Worker) is automatically disabled in production builds. No extra configuration needed.

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
