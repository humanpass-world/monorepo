import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import socialRoutes from './social';
import walletRoutes from './wallet';

const verifyRoutes = fromHono(new Hono<ContextType>());

verifyRoutes.route('/social', socialRoutes);
verifyRoutes.route('/wallet', walletRoutes);

export default verifyRoutes;
