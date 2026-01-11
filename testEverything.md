# Manual Testing Guide

This document outlines the workflow to verify all implemented features of the Meme Coin Aggregator.

## Prerequisites
1. Ensure Redis is running: `redis-server`
2. Start the application: `npm run dev`
3. Application running at: `http://localhost:3000`

---

## 1. REST API Verification

### Feature: Health Check
**Goal**: Verify server is up.
- **Action**: Open browser/request to `http://localhost:3000/health`
- **Expected**: JSON response `{ "status": "ok", "uptime": <number> }`

### Feature: Live Discovery (Aggregation)
**Goal**: Fetch aggregated data from DexScreener & GeckoTerminal.
- **Action**: GET `http://localhost:3000/api/tokens?limit=5`
- **Expected**: 
  - List of 5 tokens.
  - Each token has `priceUsd`, `volume24h`, and `source` array (should see `['dexscreener']` or mixed).
  - Response includes `metadata.cursor`.

### Feature: Sorting
**Goal**: Verify sorting logic.
- **Action**: GET `http://localhost:3000/api/tokens?sort=volume`
- **Expected**: First token should have the highest `volume24h` in the list.
- **Action**: GET `http://localhost:3000/api/tokens?sort=change`
- **Expected**: Ordered by absolute price change.

### Feature: Pagination
**Goal**: Traverse data.
1. Make request: GET `http://localhost:3000/api/tokens?limit=2`
2. Copy `cursor` value from response metadata (e.g., `"2"`).
3. Make next request: GET `http://localhost:3000/api/tokens?limit=2&cursor=2`
- **Expected**: The returned tokens should be different from the first request (the next 2 in the list).

---

## 2. WebSocket & Real-Time Updates

### Feature: Real-time Delta Updates
**Goal**: Verify clients receive push updates when prices/volume change.

**Step-by-step**:
1. Open a browser (Chrome/Firefox).
2. Open Developer Tools (F12) -> Console.
3. Paste the following client code to simulate a frontend:

```javascript
// Load Socket.io client script dynamically
// Load Socket.IO client from SAME origin (allowed by CSP)
const script = document.createElement("script");
script.src = "http://localhost:3000/socket.io/socket.io.js";
script.async = true;

script.onload = () => {
  console.log("✅ Socket.IO client loaded");

  const socket = io("http://localhost:3000", {
    transports: ["websocket"], // force WS (cleaner debugging)
  });

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);

    socket.emit("subscribe", "discover");
    console.log('📡 Subscribed to "discover" feed');
  });

  socket.on("market-update", (data) => {
    console.log("🔥 MARKET UPDATE RECEIVED");
    console.table(data);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("🚨 Connection error:", err.message);
  });
};

script.onerror = () => {
  console.error("❌ Failed to load Socket.IO client");
};

document.head.appendChild(script);

```

4. **Observation**: 
   - You should immediately see "✅ Connected...".
   - Wait 10-20 seconds (Polling interval is 10s).
   - **Expected**: If prices change >0.5% or vol >1%, you will see logs appearing: `🔥 UPDATE RECEIVED`.
   - *Note*: If the market is very stable, you might not see updates immediately. You can trigger a "fake" change by modifying `src/services/polling.ts` logic slightly to lower the threshold to `0` for testing purposes.

---

## 3. Resilience & Caching

### Feature: Caching
**Goal**: Ensure subsequent requests are fast.
1. Request `http://localhost:3000/api/tokens` (First request might take 1-2s to fetch from external APIs).
2. Request it again immediately.
- **Expected**: Response should be near instant (<50ms) as it hits Redis.

### Feature: Rate Limiting / Backoff
**Goal**: Verify system handles upstream pressure.
- **Action**: Check server logs in terminal.
- **Expected**: You should NOT see "Axios Error: 429 Too Many Requests". If DexScreener rate limits, looking at logs should show the retry logic taking effect (delays between retries).

---

## Implemented Features Checklist

- [x] **Multi-Source Aggregation**: Merges DexScreener & GeckoTerminal data.
- [x] **Conflict Resolution**: Logic handles duplicate tokens by creating a "Unified" token view.
- [x] **Redis Caching**: 'GLOBAL_TRENDING' key stores the source of truth; expires every 60s.
- [x] **Polling Daemon**: Background service refreshes data every 10s.
- [x] **Delta Calculation**: Only broadcasts significant changes to minimize bandwidth.
- [x] **Cursor Pagination**: Efficiently traverse large lists.
- [x] **WebSocket Server**: Room-based architecture ('discover' room).
- [x] **Resilient HTTP**: Exponential backoff implemented for external calls.
