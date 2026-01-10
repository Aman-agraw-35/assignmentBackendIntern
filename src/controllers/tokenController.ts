import { Request, Response } from 'express';
import { aggregator } from '../services/aggregator';

export class TokenController {
    static async getTokens(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const cursor = parseInt(req.query.cursor as string) || 0;
            const sort = req.query.sort as any;

            const result = await aggregator.getDiscoverData(limit, cursor, sort);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            await aggregator.fetchAndAggregate('SOL');
            res.json({ status: 'ok', message: 'Refresh triggered' });
        } catch (e) {
            res.status(500).json({ error: 'Failed' });
        }
    }
}
