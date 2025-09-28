import { eq, users } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class MiniappAuthSession extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Auth'],
		summary: 'Get session',
		security: [{ cookie: [] }],
		responses: {
			'200': {
				description: 'Check session',
				content: {
					'application/json': {
						schema: z.object({
							address: z.string(),
							username: z.string(),
							profilePictureUrl: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const userId = c.get('userId');

		const user = await c.get('db').query.users.findFirst({
			where: eq(users.address, userId),
		});

		if (!user) {
			return c.json({ error: 'User not found' }, 404);
		}

		return {
			address: user.address,
			username: user.username,
			profilePictureUrl: user.profilePictureUrl,
		};
	}
}
