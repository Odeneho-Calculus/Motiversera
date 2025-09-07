---
description: Repository Information Overview
alwaysApply: true
---

# MotiVersera Information

## Summary
MotiVersera is a web application built with React, TypeScript, and Vite that allows users to create, edit, and export visual content. It integrates with the Pixabay API for image and video resources and uses FFMPEG for media processing.

## Structure
- **src/**: Frontend React application code
  - **api/**: API client code
  - **components/**: Reusable UI components
  - **layout/**: Layout components like AppShell
  - **pages/**: Page components (Editor, Export, Gallery, Home)
  - **styles/**: SCSS styles and variables
  - **utils/**: Utility functions
- **server/**: Express.js backend server
- **public/**: Static assets including FFMPEG binaries

## Language & Runtime
**Language**: TypeScript (frontend), JavaScript (backend)
**Version**: TypeScript ~5.8.3, ES2022/ES2023 target
**Build System**: Vite 7.1.2
**Package Manager**: PNPM (based on pnpm-lock.yaml presence)

## Dependencies
**Main Dependencies**:
- React 19.1.1 with React Router 7.8.2
- Express 5.1.0 for backend API
- FFMPEG (@ffmpeg/core 0.12.10, @ffmpeg/ffmpeg 0.12.15) for media processing
- Axios 1.11.0 for HTTP requests
- SASS for styling (sass 1.80.3, sass-embedded 1.92.1)

**Development Dependencies**:
- TypeScript 5.8.3
- ESLint 9.33.0 with React plugins
- Vite 7.1.2 with React SWC plugin
- Concurrently 9.2.1 for running multiple processes

## Build & Installation
```bash
# Install dependencies
pnpm install

# Development mode (client + server)
pnpm dev

# Client only
pnpm dev:client

# Server only
pnpm dev:server

# Production build
pnpm build

# Preview production build
pnpm preview
```

## Server API
**Port**: 5174 (default)
**Endpoints**:
- `/api/pixabay/images`: Proxy for Pixabay image API
- `/api/pixabay/videos`: Proxy for Pixabay video API
- `/api/health`: Health check endpoint

## Client Application
**Port**: 5173 (default)
**Entry Point**: src/main.tsx
**Routing**: React Router (src/AppRouter.tsx)
**Main Pages**:
- Home: Landing page
- Editor: Content creation interface
- Gallery: Media browsing interface
- Export: Content export functionality

## Environment Configuration
**Environment Variables**:
- `PIXABAY_API_KEY`: Required for Pixabay API access
- `PORT`: Server port (default: 5174)
- `VITE_DEV_PORT`: Client dev server port (default: 5173)
- `VITE_API_URL`: Optional full API URL
- `VITE_API_HOST`: API host (default: http://localhost)
- `VITE_API_PORT`: API port (default: 5174)