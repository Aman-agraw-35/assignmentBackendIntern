import { DexSource, TokenData } from '../../types';
import { dexClient } from '../../utils/httpClient';

export class GeckoTerminalProvider implements DexSource {
    name = 'geckoterminal';

    async fetchTokens(query: string = 'SOL'): Promise<TokenData[]> {
        try {
            // GeckoTerminal Search Pools API
            const { data: response } = await dexClient.get(`https://api.geckoterminal.com/api/v2/search/pools?query=${query}`, {
                retry: 3,
            } as any);

            if (!response.data) return [];

            return response.data.map((item: any) => {
                const attr = item.attributes;
                return {
                    address: attr.address,
                    name: attr.name,
                    symbol: attr.name.split('/')[0].trim(),
                    priceUsd: parseFloat(attr.base_token_price_usd) || 0,
                    liquidity: parseFloat(attr.reserve_in_usd) || 0,
                    volume24h: parseFloat(attr.volume_usd?.h24) || 0,
                    priceChange24h: parseFloat(attr.price_change_percentage?.h24) || 0,
                    priceChange1h: 0,
                    marketCap: parseFloat(attr.fdv_usd) || 0,
                    timestamp: Date.now(),
                    source: ['geckoterminal']
                } as TokenData;
            }).filter((t: any) => t.priceUsd > 0);
        } catch (error) {
            console.warn('GeckoTerminal fetch failed (likely rate limit or strict headers)', error instanceof Error ? error.message : 'Unknown');
            return [];
        }
    }
}
