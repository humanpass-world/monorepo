import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { MiniappVerifiedSocialDisconnect } from './disconnect';
import { MiniappVerifiedSocialList } from './list';

const socialRoutes = fromHono(new Hono<ContextType>());

socialRoutes.get('/list', MiniappVerifiedSocialList);
socialRoutes.delete('/disconnect', MiniappVerifiedSocialDisconnect);

export default socialRoutes;
