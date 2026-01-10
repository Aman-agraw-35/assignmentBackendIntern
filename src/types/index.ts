export interface TokenData {
    address: string;
    name: string;
    symbol: string;
    priceUsd: number;
    liquidity: number;
    volume24h: number;
    priceChange24h: number;
    priceChange1h: number;
    timestamp: number;
    source: string[]; // ['dexscreener', 'jupiter'] to track provenance
    marketCap: number;
}

export interface UnifiedTokenResponse {
    data: TokenData[];
    metadata: {
        total: number;
        cursor?: string;
    };
}

export interface DexSource {
    fetchTokens(query: string): Promise<TokenData[]>;
    name: string;
}
