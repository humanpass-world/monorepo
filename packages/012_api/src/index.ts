import { fromHono } from 'chanfana';
import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import miniappRoutes from './endpoints/miniapp';
import publicRoutes from './endpoints/public';
import type { ContextType } from './types';
import { useDB } from './utils/db';
import scalar from './utils/scalar';

const app = new Hono<ContextType>();

/**
 * Scalar API Docs UI
 */
app.get('/docs', async (c) => {
	return c.html(scalar());
});

/**
 * Set db to context
 */
app.use(async (c, next) => {
	c.set('db', useDB());
	await next();
});

app.use(
	'/*',
	cors({
		origin: [...env.CORS_ORIGINS.split(','), 'http://localhost:8384', 'https://app.humanpass.world', 'https://dashboard.humanpass.world'],
		credentials: true,
		allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
		exposeHeaders: ['Set-Cookie'],
	})
);

const api = fromHono<Hono<ContextType>>(app, {
	openapi_url: '/api/openapi.json',
	schema: {
		security: [{ cookieAuth: [] }, { bearerAuth: [] }],
	},
});

api.route('/miniapp', miniappRoutes);
api.route('/public', publicRoutes);

export default {
	async fetch(request, env, ctx) {
		return api.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
