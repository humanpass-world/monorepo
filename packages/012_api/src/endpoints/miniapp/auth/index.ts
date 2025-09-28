import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { requireMiniappAuth } from 'workers/utils/auth';
import { MiniappAuthCompleteSiwe } from './complete-siwe';
import { MiniappAuthNonce } from './nonce';
import { MiniappAuthSession } from './session';

const authRoutes = fromHono(new Hono<ContextType>());
authRoutes.get('/nonce', MiniappAuthNonce);
authRoutes.post('/complete-siwe', MiniappAuthCompleteSiwe);
authRoutes.use('/session', requireMiniappAuth);
authRoutes.get('/session', MiniappAuthSession);

export default authRoutes;
