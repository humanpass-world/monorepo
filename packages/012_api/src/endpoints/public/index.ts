import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import socialRoutes from './social';
import walletRoutes from './wallet';

const publicRoutes = fromHono(new Hono<ContextType>());

publicRoutes.route('/social', socialRoutes);
publicRoutes.route('/wallet', walletRoutes);

export default publicRoutes;
