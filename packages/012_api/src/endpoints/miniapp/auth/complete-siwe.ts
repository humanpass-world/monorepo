import { users } from '@hp/database';
import { computeHMAC, getUserJWT, queryUserFromWorldcoin } from '@hp/server-common';
import { OpenAPIRoute } from 'chanfana';
import { env } from 'cloudflare:workers';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class MiniappAuthCompleteSiwe extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Auth'],
		summary: 'Complete SIWE',
		security: [{ cookie: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: z.object({
							nonce: z.string(),
							hmac: z.string(),
							payload: z.any(),
						}),
					},
				},
			},
		},
		responses: {
			'200': {
				description: 'Complete SIWE',
				content: {
					'application/json': {
						schema: z.object({
							userData: z.object({
								address: z.string(),
								username: z.string(),
								profilePictureUrl: z.string(),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { nonce, hmac, payload } = data.body;

		const computedHmac = await computeHMAC(nonce, env.JWT_SECRET);

		if (computedHmac !== hmac) {
			console.error('HMAC validation failed:', computedHmac, hmac);
			return c.json(
				{
					status: 'error',
					message: 'HMAC validation failed',
				},
				400
			);
		}

		try {
			let user = await queryUserFromWorldcoin(payload.address);

			if (!user) {
				user = {
					address: payload.address,
					username: `user${Math.floor(Math.random() * 1000000)}`,
					profile_picture_url: '',
				};
			}

			const token = await getUserJWT(env.JWT_SECRET, {
				address: user.address,
				username: user.username ?? '',
				profilePictureUrl: user.profile_picture_url,
			});

			await c
				.get('db')
				.insert(users)
				.values({
					address: user.address,
					username: user.username ?? '',
					profilePictureUrl: user.profile_picture_url,
				})
				.onConflictDoUpdate({
					target: users.address,
					set: {
						username: user.username ?? '',
						profilePictureUrl: user.profile_picture_url,
					},
				})
				.returning({
					address: users.address,
				});

			c.header('Set-Cookie', `ja=${token}; Domain=.humanpass.world; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=315360000`);

			return c.json({
				userData: {
					address: user.address,
					username: user.username,
					profilePictureUrl: user.profile_picture_url,
				},
			});
		} catch (error) {
			console.error('Authentication error:', error);
			return c.json({ error: 'Failed to complete authentication' }, 500);
		}
	}
}
