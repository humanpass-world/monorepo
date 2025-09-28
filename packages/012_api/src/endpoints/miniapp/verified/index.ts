import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import socialRoutes from './social';
import walletRoutes from './wallet';

const verifiedRoutes = fromHono(new Hono<ContextType>());

verifiedRoutes.route('/social', socialRoutes);
verifiedRoutes.route('/wallet', walletRoutes);

export default verifiedRoutes;
