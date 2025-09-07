# MotiVersera

MotiVersera is a modern web application for creating, editing, and exporting visual content. Built with React, TypeScript, and Vite, it provides an intuitive interface for working with images and videos.

## Features

- **Media Gallery**: Browse and search images and videos from Pixabay
- **Content Editor**: Create and customize visual content with an intuitive interface
- **Export Options**: Export your creations in various formats
- **FFMPEG Integration**: Process media files directly in the browser

## Tech Stack

- **Frontend**: React 19, TypeScript, SASS
- **Backend**: Express.js
- **Build Tools**: Vite, SWC
- **Media Processing**: FFMPEG WebAssembly
- **API Integration**: Pixabay for images and videos

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- PNPM package manager

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
PIXABAY_API_KEY=your_pixabay_api_key
PORT=5174
VITE_DEV_PORT=5173
```

You can obtain a Pixabay API key by registering at [Pixabay API](https://pixabay.com/api/docs/).

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run both client and server in development mode
pnpm dev

# Run only the client
pnpm dev:client

# Run only the server
pnpm dev:server
```

### Production

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## API Endpoints

The server provides the following API endpoints:

- `/api/pixabay/images`: Search and retrieve images from Pixabay
- `/api/pixabay/videos`: Search and retrieve videos from Pixabay
- `/api/health`: Health check endpoint

## Project Structure

- `src/`: Frontend React application
- `server/`: Express.js backend
- `public/`: Static assets including FFMPEG binaries

## License

[MIT License](LICENSE)
```
