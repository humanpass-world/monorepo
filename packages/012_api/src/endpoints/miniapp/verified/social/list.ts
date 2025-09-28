import { and, eq, isNotNull, verifiedSocialAccounts } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class MiniappVerifiedSocialList extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verified'],
		summary: 'Verified social list',
		security: [{ cookie: [] }],
		responses: {
			'200': {
				description: 'List of verified social',
				content: {
					'application/json': {
						schema: z.object({
							list: z
								.object({
									id: z.string({ description: 'Verified Social ID' }),
									username: z.string({ description: 'Username' }),
									social: z.string({ description: 'Social' }),
									createdAt: z.date({ description: 'Created At' }),
								})
								.array(),
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
		const userId = c.get('userId');
		const verifiedSocialList = await c.get('db').query.verifiedSocialAccounts.findMany({
			where: and(eq(verifiedSocialAccounts.address, userId), isNotNull(verifiedSocialAccounts.nullifier_hash)),
		});

		return {
			list: verifiedSocialList.map((verifiedSocial) => ({
				id: verifiedSocial.id,
				username: verifiedSocial.username,
				social: verifiedSocial.social,
				createdAt: verifiedSocial.created_at,
			})),
		};
	}
}
