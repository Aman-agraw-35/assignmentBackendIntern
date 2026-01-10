import { aggregator } from '../src/services/aggregator';
import { DexScreenerProvider } from '../src/services/providers/dexScreener';
import { GeckoTerminalProvider } from '../src/services/providers/geckoTerminal';
import { cache } from '../src/services/cache';

// Mock dependencies
jest.mock('../src/services/providers/dexScreener');
jest.mock('../src/services/providers/geckoTerminal');
jest.mock('../src/services/cache');

describe('AggregatorService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should merge tokens correctly', async () => {
        const mockToken1 = {
            address: '0x123',
            name: 'MemeCoin',
            symbol: 'MEME',
            priceUsd: 1.0,
            liquidity: 1000,
            volume24h: 500,
            priceChange24h: 10,
            source: ['dexscreener']
        };

        const mockToken2 = {
            address: '0x123',
            name: 'MemeCoin',
            symbol: 'MEME',
            priceUsd: 1.1, // Different price
            liquidity: 2000, // Higher liquidity -> winner
            volume24h: 600,
            priceChange24h: 11,
            source: ['geckoterminal']
        };

        (DexScreenerProvider.prototype.fetchTokens as jest.Mock).mockResolvedValue([mockToken1]);
        (GeckoTerminalProvider.prototype.fetchTokens as jest.Mock).mockResolvedValue([mockToken2]);
        (cache.get as jest.Mock).mockResolvedValue(null);

        const result = await aggregator.getDiscoverData(10, 0);

        expect(result.data.length).toBe(1);
        const merged = result.data[0];

        expect(merged.priceUsd).toBe(1.1); // Expect price from higher liquidity source
        expect(merged.source).toContain('dexscreener');
        expect(merged.source).toContain('geckoterminal');
        expect(merged.volume24h).toBe(600); // Max volume
    });

    it('should handle one provider failing', async () => {
        (DexScreenerProvider.prototype.fetchTokens as jest.Mock).mockResolvedValue([]);
        (GeckoTerminalProvider.prototype.fetchTokens as jest.Mock).mockRejectedValue(new Error('API Down'));
        (cache.get as jest.Mock).mockResolvedValue(null);

        const result = await aggregator.getDiscoverData(10, 0);

        // Should succeed with empty list or whatever DexScreener returned (empty here)
        expect(result.data).toEqual([]);
    });

    it('should return cached data if available', async () => {
        const cachedData = [{ address: '0xCached' }];
        (cache.get as jest.Mock).mockResolvedValue(cachedData);

        const result = await aggregator.getDiscoverData();

        expect(result.data).toEqual(cachedData);
        expect(DexScreenerProvider.prototype.fetchTokens).not.toHaveBeenCalled();
    });

    it('should sort by volume correctly', async () => {
        const t1 = { address: 'A', volume24h: 100, liquidity: 10 } as any;
        const t2 = { address: 'B', volume24h: 200, liquidity: 10 } as any;
        (cache.get as jest.Mock).mockResolvedValue([t1, t2]);

        const result = await aggregator.getDiscoverData(20, 0, 'volume');
        expect(result.data[0].address).toBe('B');
    });

    it('should paginate correctly', async () => {
        const list = Array.from({ length: 50 }, (_, i) => ({ address: `${i}` })) as any;
        (cache.get as jest.Mock).mockResolvedValue(list);

        const result = await aggregator.getDiscoverData(10, 10); // Page 2
        expect(result.data.length).toBe(10);
        expect(result.data[0].address).toBe('10');
        expect(result.metadata.cursor).toBe('20');
    });

    it('should handle end of pagination', async () => {
        const list = Array.from({ length: 15 }, (_, i) => ({ address: `${i}` })) as any;
        (cache.get as jest.Mock).mockResolvedValue(list);

        const result = await aggregator.getDiscoverData(10, 10);
        expect(result.data.length).toBe(5);
        expect(result.metadata.cursor).toBeUndefined();
    });
});
