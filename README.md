# Mostashari Web App

Frontend for legal search and consultation workflows.

## What this app does

- Provides three user-facing tabs:
	- Consult (default tab)
	- Regulations Search
	- Cases Search
- Supports Arabic and English UI switching.
- Handles RTL and LTR layout behavior for tab/header placement.
- Sends search and chat requests to a backend API.
- Stores and reuses chat session IDs in local storage.

## Tech stack

- React 19
- Vite 6
- Vitest + Testing Library

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Running backend API

## Environment variables

Create a local env file named .env.local in the project root.

Use Vite-prefixed keys for frontend runtime access:

```env
VITE_BACKEND_URL=http://localhost:8001
VITE_BACKEND_API_KEY=replace-with-api-key

# Optional metadata shown in footer
VITE_VERSION=0.1.0
VITE_COMMIT_HASH=local
VITE_BRANCH_NAME=local

# Optional search config keys (if your backend requires them)
VITE_REG_SEARCH_SERVICE=
VITE_REG_SEARCH_KEY=
VITE_REG_SEARCH_INDEX=
VITE_REG_SEMANTIC_CONFIG=
VITE_CASES_SEARCH_SERVICE=
VITE_CASES_SEARCH_KEY=
VITE_CASES_SEARCH_INDEX=
VITE_CASES_SEMANTIC_CONFIG=
```

Notes:

- Only variables starting with VITE_ are exposed to browser code.
- Restart the dev server after changing env values.
- Do not commit real secrets.

## Run locally

Install dependencies:

```bash
npm install
```

Start the UI in development watch mode:

```bash
npm start
```

Default local URL:

- http://localhost:3000

## Testing

Run tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Build

Create production build output in build:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Project structure

- src/App.jsx: app shell, language toggle, tabs, and top-level layout
- src/components/SearchContent.jsx: search results rendering
- src/components/ChatContent.jsx: consult/chat experience
- src/hooks/useSearch.js: search state and submit flow
- src/services/azureSearchService.js: search API integration + cache
- src/services/chatService.js: chat session and messaging API integration
