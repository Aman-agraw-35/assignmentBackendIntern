import request from 'supertest';
import app from '../src/app';
import { aggregator } from '../src/services/aggregator';

jest.mock('../src/services/aggregator');
jest.mock('../src/websocket/socketServer'); // prevent socket init issues
jest.mock('ioredis', () => require('ioredis-mock')); // Mock redis connection in cache

describe('API Endpoints', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /health returns 200', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('GET /api/tokens defaults to 20 items', async () => {
        (aggregator.getDiscoverData as jest.Mock).mockResolvedValue({
            data: [],
            metadata: { total: 0 }
        });

        await request(app).get('/api/tokens');

        expect(aggregator.getDiscoverData).toHaveBeenCalledWith(20, 0, undefined);
    });

    it('GET /api/tokens accepts parameters', async () => {
        (aggregator.getDiscoverData as jest.Mock).mockResolvedValue({
            data: [],
            metadata: { total: 0 }
        });

        await request(app).get('/api/tokens?limit=10&cursor=5&sort=volume');

        expect(aggregator.getDiscoverData).toHaveBeenCalledWith(10, 5, 'volume');
    });

    it('GET /api/tokens handles errors', async () => {
        (aggregator.getDiscoverData as jest.Mock).mockRejectedValue(new Error('Fail'));
        const spy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const res = await request(app).get('/api/tokens');

        expect(res.status).toBe(500);
        spy.mockRestore();
        // implicit check for error message logic being generic
    });
});
