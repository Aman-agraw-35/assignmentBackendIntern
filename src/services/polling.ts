import { aggregator } from './aggregator';
import { broadcastUpdate } from '../websocket/socketServer';
import { cache } from './cache';
import { TokenData } from '../types';

class PollingService {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly INTERVAL_MS = 10000; // 10s updates
    private lastState: Map<string, TokenData> = new Map();

    start() {
        if (this.intervalId) return;
        console.log('Starting polling service...');
        this.poll(); // immediate
        this.intervalId = setInterval(() => this.poll(), this.INTERVAL_MS);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private async poll() {
        try {
            const newData = await aggregator.fetchAndAggregate('SOL');

            await cache.set('GLOBAL_TRENDING', newData, 60);

            const updates: TokenData[] = [];

            for (const token of newData) {
                const old = this.lastState.get(token.address);
                if (!old) {
                    updates.push(token);
                } else {
                    const priceDiff = Math.abs((token.priceUsd - old.priceUsd) / old.priceUsd);
                    const volDiff = Math.abs((token.volume24h - old.volume24h) / old.volume24h);

                    if (priceDiff > 0.005 || volDiff > 0.01) {
                        updates.push(token);
                    }
                }
                this.lastState.set(token.address, token);
            }

            if (updates.length > 0) {
                broadcastUpdate(updates);
            }

        } catch (e) {
            console.error('Polling error:', e);
        }
    }
}

export const pollingService = new PollingService();
