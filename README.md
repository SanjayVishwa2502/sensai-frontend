# SensAI Frontend

Frontend application for SensAI, built with Next.js. This repository provides the role-based web interface for learners and admins, including learning workflows, engagement views, and AI-assisted interactions.

## Table Of Contents
- Overview
- Core Capabilities
- Tech Stack
- Repository Layout
- Prerequisites
- Quick Start
- Environment Configuration
- Development Commands
- Testing
- Build And Production Run
- Backend Integration
- Troubleshooting
- Contributing

## Overview
SensAI Frontend delivers:
- role-based user journeys,
- learner and admin dashboards,
- interactive course, quiz, and engagement experiences,
- AI-enabled assistance integrated with backend APIs.

This app is intended to run alongside the SensAI backend service.

## Core Capabilities
- Next.js App Router structure
- Admin and learner workflow interfaces
- Engagement and progress visualization
- AI interaction surfaces integrated with backend APIs
- Sentry-ready client and server instrumentation
- Jest-based unit and component testing

## Tech Stack
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Jest and Testing Library
- Sentry SDK for observability

## Repository Layout
- src/app/: route and page structure
- src/components/: reusable UI components
- src/context/: state and feature contexts
- src/lib/: utilities and API helpers
- src/providers/: app providers
- src/__tests__/: unit and component tests
- public/: static assets
- .env.example: environment variable template

## Prerequisites
- Node.js 20+
- npm 10+
- SensAI backend running locally

## Quick Start
1. Clone and enter the frontend repository.

```bash
git clone https://github.com/dalmia/sensai-frontend.git
cd sensai-frontend
```

2. Install dependencies.

```bash
npm ci
```

3. Copy environment template.

```bash
cp .env.example .env.local
```

4. Update .env.local values (especially backend URL and auth credentials).

5. Run development server.

```bash
npm run dev
```

Local app URL: http://localhost:3000

## Environment Configuration
Use .env.example as the base template. Common variables:
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- BACKEND_URL
- NEXT_PUBLIC_BACKEND_URL
- NEXT_PUBLIC_APP_URL
- JUDGE0_API_URL
- NOTION_CLIENT_ID
- NOTION_CLIENT_SECRET
- NEXT_PUBLIC_SENTRY_DSN

For local development with this workspace, backend URLs are commonly set to:
- BACKEND_URL=http://localhost:8001
- NEXT_PUBLIC_BACKEND_URL=http://localhost:8001

## Development Commands
- Start dev server:

```bash
npm run dev
```

- Start dev server after clearing .next cache:

```bash
npm run dev:clean
```

- Start dev server with Turbopack:

```bash
npm run dev:turbo
```

- Lint:

```bash
npm run lint
```

## Testing
- Run tests:

```bash
npm run test
```

- Run tests in watch mode:

```bash
npm run test:watch
```

- Run CI test mode with coverage and report file:

```bash
npm run test:ci
```

- Run coverage locally:

```bash
npm run test:coverage
```

## Build And Production Run
- Build:

```bash
npm run build
```

- Start production server:

```bash
npm run start
```

## Backend Integration
This frontend depends on backend APIs for auth-linked flows, AI requests, course and quiz operations, and engagement metrics.

Recommended local pairing:
- Frontend: http://localhost:3000
- Backend: http://localhost:8001

## Troubleshooting
- App fails to start after branch switches:
  - Run npm run dev:clean to remove stale .next build output.
- API errors in browser:
  - Verify BACKEND_URL and NEXT_PUBLIC_BACKEND_URL in .env.local.
  - Confirm backend service is running and reachable.
- OAuth issues:
  - Re-check NEXTAUTH and Google OAuth variables.

## Contributing
Contribution workflow and standards are maintained in the backend contribution guide:
https://github.com/dalmia/sensai-backend/blob/main/docs/CONTRIBUTING.md
