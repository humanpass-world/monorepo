import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { PublicSocialCheckFacebook } from './facebook';
import { PublicSocialCheckFarcaster } from './farcaster';
import { PublicSocialCheckTelegram } from './telegram';
import { PublicSocialCheckX } from './x';

const socialRoutes = fromHono(new Hono<ContextType>());

socialRoutes.get('/check/x', PublicSocialCheckX);
socialRoutes.get('/check/farcaster', PublicSocialCheckFarcaster);
socialRoutes.get('/check/telegram', PublicSocialCheckTelegram);
socialRoutes.get('/check/facebook', PublicSocialCheckFacebook);

export default socialRoutes;
