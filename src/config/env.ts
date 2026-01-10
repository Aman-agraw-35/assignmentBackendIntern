import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    cacheTtl: parseInt(process.env.CACHE_TTL || '30', 10),
    dexScreenerApi: 'https://api.dexscreener.com/latest/dex',
    jupiterApi: 'https://lite-api.jup.ag/tokens/v2',
};
