import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { MiniappVerifySocialX } from './x';
import { MiniappVerifySocialXProof } from './x-proof';

const socialRoutes = fromHono(new Hono<ContextType>());

socialRoutes.get('/x', MiniappVerifySocialX);
socialRoutes.post('/x/proof', MiniappVerifySocialXProof);

export default socialRoutes;
