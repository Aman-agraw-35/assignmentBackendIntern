import { Router } from 'express';
import { TokenController } from '../controllers/tokenController';

const router = Router();

router.get('/tokens', TokenController.getTokens);
router.post('/refresh', TokenController.refresh);

export default router;
