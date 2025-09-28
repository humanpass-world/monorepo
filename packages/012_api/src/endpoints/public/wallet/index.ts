import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { PublicWalletCheck } from './check';

const walletRoutes = fromHono(new Hono<ContextType>());

walletRoutes.get('/check', PublicWalletCheck);

export default walletRoutes;
