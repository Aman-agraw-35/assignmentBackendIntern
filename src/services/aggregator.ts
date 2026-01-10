import { TokenData, UnifiedTokenResponse } from '../types';
import { DexScreenerProvider } from './providers/dexScreener';
import { GeckoTerminalProvider } from './providers/geckoTerminal';
import { cache } from './cache';

class AggregatorService {
    private providers = [
        new DexScreenerProvider(),
        new GeckoTerminalProvider()
    ];

    private mergeTokens(t1: TokenData, t2: TokenData): TokenData {
        const base = t1.liquidity > t2.liquidity ? t1 : t2;
        const other = t1.liquidity > t2.liquidity ? t2 : t1;

        return {
            ...base,
            source: Array.from(new Set([...t1.source, ...t2.source])),
            volume24h: Math.max(t1.volume24h, t2.volume24h),
        };
    }

    async fetchAndAggregate(query: string): Promise<TokenData[]> {
        const results = await Promise.allSettled(
            this.providers.map(p => p.fetchTokens(query))
        );

        const rawTokens: TokenData[] = [];
        results.forEach(r => {
            if (r.status === 'fulfilled') {
                rawTokens.push(...r.value);
            }
        });

        const map = new Map<string, TokenData>();

        for (const t of rawTokens) {
            if (map.has(t.address)) {
                map.set(t.address, this.mergeTokens(map.get(t.address)!, t));
            } else {
                map.set(t.address, t);
            }
        }

        return Array.from(map.values());
    }

    async getDiscoverData(limit: number = 20, cursor: number = 0, sortBy: 'volume' | 'liquidity' | 'marketCap' | 'change' = 'liquidity'): Promise<UnifiedTokenResponse> {
        let globalList = await cache.get<TokenData[]>('GLOBAL_TRENDING');

        if (!globalList) {
            globalList = await this.fetchAndAggregate('SOL');
            await cache.set('GLOBAL_TRENDING', globalList, 60);
        }

        globalList.sort((a, b) => {
            switch (sortBy) {
                case 'volume': return b.volume24h - a.volume24h;
                case 'marketCap': return b.marketCap - a.marketCap;
                case 'change': return Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h);
                case 'liquidity':
                default: return b.liquidity - a.liquidity;
            }
        });

        const nextCursor = cursor + limit < globalList.length ? (cursor + limit).toString() : undefined;
        const data = globalList.slice(cursor, cursor + limit);

        return {
            data,
            metadata: {
                total: globalList.length,
                cursor: nextCursor
            }
        };
    }
}

export const aggregator = new AggregatorService();
