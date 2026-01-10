import { DexSource, TokenData } from '../../types';
import { dexClient } from '../../utils/httpClient';
import { config } from '../../config/env';

export class DexScreenerProvider implements DexSource {
    name = 'dexscreener';

    async fetchTokens(query: string = 'SOL'): Promise<TokenData[]> {
        try {
            const { data } = await dexClient.get(`${config.dexScreenerApi}/search?q=${query}`, {
                retry: 3,
            } as any);

            if (!data.pairs) return [];

            return data.pairs.map((pair: any) => ({
                address: pair.baseToken.address,
                name: pair.baseToken.name,
                symbol: pair.baseToken.symbol,
                priceUsd: parseFloat(pair.priceUsd) || 0,
                liquidity: pair.liquidity?.usd || 0,
                volume24h: pair.volume?.h24 || 0,
                priceChange24h: pair.priceChange?.h24 || 0,
                priceChange1h: pair.priceChange?.h1 || 0,
                marketCap: pair.fdv || 0,
                timestamp: Date.now(),
                source: ['dexscreener']
            }));
        } catch (error) {
            console.error('DexScreener fetch failed', error);
            return [];
        }
    }
}
