import axios from 'axios';
import { dexClient } from '../src/utils/httpClient';
import MockAdapter from 'axios-mock-adapter';

// We need to access the underlying axios instance to mock it
// Since dexClient IS an AxiosInstance, we can use axios-mock-adapter on it
describe('HTTP Client Retry Logic', () => {
    let mock: MockAdapter;

    beforeAll(() => {
        mock = new MockAdapter(dexClient as any);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should retry on failure', async () => {
        // Mock 429 then 200
        mock.onGet('/test').replyOnce(429).onGet('/test').replyOnce(200, { ok: true });

        const start = Date.now();
        const res = await dexClient.get('/test', { retry: 3 } as any);
        const diff = Date.now() - start;

        expect(res.data.ok).toBe(true);
        // First retry delay is 200ms
        expect(diff).toBeGreaterThanOrEqual(200);
    });

    it('should fail after max retries', async () => {
        mock.onGet('/fail').reply(500);

        try {
            await dexClient.get('/fail', { retry: 2 } as any);
            fail('Should have thrown');
        } catch (e: any) {
            // Should fail
            expect(e).toBeDefined();
        }
    });
});
