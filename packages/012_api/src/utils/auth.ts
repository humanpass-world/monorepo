import { UserJWTPayload } from '@hp/server-common';
import { env } from 'cloudflare:workers';
import { verify } from 'hono/jwt';
import type { AppContext } from '../types';

export async function requireMiniappAuth(c: AppContext, next: any) {
	let token: string | undefined = undefined;
	const cookie = c.req.header('cookie');
	let tokenFromCookie = (cookie ?? '').split(';').find((c) => c.trim().startsWith('ja='));

	token = tokenFromCookie?.replace('ja=', '').trim();

	if (!token) {
		// fallback to bearer auth
		const bearer = c.req.header('Authorization');
		token = bearer?.replace('Bearer ', '').trim();

		if (!token) {
			return c.json(
				{
					code: 'UNAUTHORIZED',
					error: 'Unauthorized - Authentication required',
				},
				401
			);
		}
	}

	try {
		const payload = (await verify(token, env.JWT_SECRET)) as UserJWTPayload;
		c.set('userId', payload.address);

		await next();
	} catch (error) {
		return c.json({ code: 'UNAUTHORIZED', error: 'Invalid token' }, 401);
	}
}

// OpenAPI 보안 스키마
export const securitySchemes = {
	cookieAuth: {
		type: 'apiKey',
		in: 'cookie',
		name: 'token',
		description: 'Token for authentication',
	},
	bearerAuth: {
		type: 'apiKey',
		in: 'header',
		name: 'Authorization',
		description: "Bearer token for authentication (use token with 'Bearer ' prefix)",
	},
} as const;
