import { and, eq, verifiedSocialAccounts } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class MiniappVerifiedSocialDisconnect extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verified'],
		summary: 'Verified social disconnect',
		security: [{ cookie: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: z.object({
							verifiedSocialId: z.string(),
						}),
					},
				},
			},
		},
		responses: {
			'200': {
				description: 'Verified social disconnect result',
				content: {
					'application/json': {
						schema: z.object({
							success: z.literal(true),
						}),
					},
				},
			},
			'401': {
				description: 'Unauthorized - Authentication required',
				content: {
					'application/json': {
						schema: z.object({
							code: z.literal('UNAUTHORIZED'),
							error: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const userId = c.get('userId');

		const { verifiedSocialId } = data.body;

		await c
			.get('db')
			.delete(verifiedSocialAccounts)
			.where(and(eq(verifiedSocialAccounts.id, verifiedSocialId), eq(verifiedSocialAccounts.address, userId)));

		return {
			success: true,
		};
	}
}
