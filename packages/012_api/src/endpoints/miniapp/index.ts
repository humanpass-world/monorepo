import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { requireMiniappAuth } from 'workers/utils/auth';
import authRoutes from './auth';
import verifiedRoutes from './verified';
import verifyRoutes from './verify';
import { MiniappVerifySocialXCallback } from './verify/social/x-callback';
import { MiniappVerifyWalletPolling } from './verify/wallet/polling';
import { MiniappVerifyWalletRequest } from './verify/wallet/request';

const miniappRoutes = fromHono(new Hono<ContextType>());

miniappRoutes.route('/auth', authRoutes);
miniappRoutes.get('/verify/social/x/callback', MiniappVerifySocialXCallback);
miniappRoutes.post('/verify/wallet/request', MiniappVerifyWalletRequest);
miniappRoutes.get('/verify/wallet/polling', MiniappVerifyWalletPolling);

miniappRoutes.use('*', requireMiniappAuth);
miniappRoutes.route('/verify', verifyRoutes);
miniappRoutes.route('/verified', verifiedRoutes);

export default miniappRoutes;
