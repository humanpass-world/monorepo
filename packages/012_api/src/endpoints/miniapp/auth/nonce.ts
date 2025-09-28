import { computeHMAC } from '@hp/server-common';
import { OpenAPIRoute } from 'chanfana';
import { env } from 'cloudflare:workers';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class MiniappAuthNonce extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Auth'],
		summary: 'Get nonce',
		security: [{ cookie: [] }],
		responses: {
			'200': {
				description: 'Get nonce',
				content: {
					'application/json': {
						schema: z.object({
							nonce: z.string(),
							hmac: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const nonce = crypto.randomUUID().replace(/-/g, '');
		const hmac = await computeHMAC(nonce, env.JWT_SECRET);

		return {
			nonce,
			hmac,
		};
	}
}
