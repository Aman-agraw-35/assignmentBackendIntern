# Meme Coin Aggregator Service

A backend service that aggregates real-time meme coin data from DexScreener and GeckoTerminal. Designed for high throughput and real-time updates via WebSockets.

## Live Link

[Link to the API](https://assignmentbackendintern.onrender.com/health)

## Architecture Highlights

- **Multi-Source Aggregation**: Fetches data from multiple real APIs and merges them based on liquidity and volume.
- **Optimistic Caching**: Uses Redis to cache aggregated lists, reducing API pressure significantly.
- **Delta Updates**: WebSocket broadcasts only significant changes (price > 0.5% or vol > 1%) to conserve bandwidth.
- **Resilience**: Custom HTTP client with exponential backoff for handling rate limits.

## Getting Started

### Prerequisites

- Node.js v18+
- Redis (local or remote)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file (see `.env.example`):

```bash
PORT=3000
REDIS_URL=redis://localhost:6379
CACHE_TTL=30
```

### Running Locally

```bash
# Start Redis first!
npm run dev
```

The server will start at `http://localhost:3000`.

### API Usage

- **Get Tokens**: `GET /api/tokens?limit=20&sort=liquidity`
- **WebSocket**: Connect to `/` and emit `subscribe` with room name `discover`.

## Trade-offs & Decisions

- **Poll vs Push**: Since upstream APIs like DexScreener don't offer free WebSockets for all tokens, we poll their REST APIs periodically and calculate deltas server-side to simulate a real-time feed for our clients.
- **In-Memory Delta Tracking**: For simplicity, `lastKnownState` is kept in process memory. In a distributed setup, this should move to Redis to allow multiple workers to detect changes consistently.
- **GeckoTerminal vs Jupiter**: Used GeckoTerminal as the secondary source strictly for the "Pools" endpoint which maps better to meme coin liquidity discovery than Jupiter's token list API.

## Project Structure

```
src/
  services/    # Core logic (Aggregator, Cache, Providers)
  websocket/   # Socket.io handlers
  controllers/ # HTTP Request handlers
  utils/       # Shared helpers (Retry logic, etc)
```

## Deployment

Deployable to any Node.js environment (Render, Railway, Heroku). Ensure `REDIS_URL` is set.


